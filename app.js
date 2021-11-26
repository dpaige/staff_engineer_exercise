const fs = require("fs");
const path = require("path");
const express = require("express");
const fetch = require("node-fetch");
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true })); //for parsing application/x-www-form-urlencoded

app.get("/prs", async (req, res) => {
  try {
    const configsString = await getConfigs();
    if (!configsString) {
      //configs is a string
      sendHttpStatus(res, 404, "Missing configs.json file");
      return;
    }
    //configs is a string - turn to JSON object
    const configs = JSON.parse(configsString);
    if (!Object.keys(configs).length) {
      sendHttpStatus(res, 404, "Configs format not JSON");
      return;
    }
    
    //set up basic auth variables for use in HTTP requests
    const auth = basicAuth(configs);
    const baseUrl = configs.baseUrl;
    const org = configs.org;

    //get repos JSON for organization: e.g. /orgs/{org}/repos
    //per_page: max 100
    //type options: all, public, private, forks, sources, member, internal
    const getReposUrl = `${baseUrl}/orgs/${org}/repos?per_page=${configs.reposPerPage}&type=${configs.reposType}`;
    const reposRaw = await getFetch(getReposUrl, auth);
    const repos = await reposRaw.json();
    if (!Object.keys(repos) || repos.length === 0) {
      sendHttpStatus(res, 404, `No repos found for organization ${org}`);
      return;
    }

    //create array of repo names for organization
    let repoNames = [];
    repos.forEach(repo => {
      repoNames.push(repo.name);
    });
    if (repoNames.length === 0) {
      sendHttpStatus(res, 404, `Problem with repo names for organization ${org}`);
      return;
    }

    //get list of pulls for all repos in organization
    //repoNames = ["ramda-fantasy", "ramda-lens"]; //TESTING - REMOVE!!!!!
    const pulls = await getPulls(auth, repoNames, configs);

    sendHttpStatus(res, 200, JSON.stringify(pulls));
  } catch (error) {
    sendHttpStatus(res, 400, `Error: ${error}`);
  }
});

const basicAuth = (configs) => {
  return btoa(`${configs.username}:${configs.token}`);
};

//convert string to base64
const btoa = (value) => Buffer.from(value).toString("base64");

//get configuration file from directory
const getConfigs = () => {
  try {
    const configs = fs.readFileSync(
      path.resolve("/Users/davepaige/dev/staff_engineer_exercise", "configs.json"),
      "utf8",
      (err, data) => {
        if (err) {
          console.log(`Error: ${err}`);
          return;
        }
      }
    );
    return configs;
  } catch (error) {
    console.error(`Error: ${error}`);
  }
};

const getFetch = async (url, auth) => {
  try {
    let response = await fetch(
      url,
      {
        method: "GET",
        headers: {
          Accept: "application/vnd.github.v3+json",
          Authorization: `Basic ${auth}`
        }
      }
    );
    return await response;
  } catch (error) {
    console.error(`Error: ${error}`);
  }
};

//get pull requests: e.g. /repos/{owner}/{repo}/pulls
const getPulls = async (auth, repoNames, configs) => {
  try {
    let allPulls = [];
    for (let i = 0; i < repoNames.length; i++) {
      const name = repoNames[i];
      //per_page: max 100
      //state options: open, closed, or all
      const url = `${configs.baseUrl}/repos/${configs.org}/${name}/pulls?per_page=${configs.pullsPerPage}&state=${configs.pullsState}`;
      const prData = await getPrData(url, auth);
      allPulls.push(prData);
    }
    return allPulls;
  } catch (error) {
    console.error(`Error: ${error}`);
  }
};

const getPrData = async (url, auth) => {
  let allPrs = [];
  const prRaw = await getFetch(url, auth);
  const pr = await prRaw.json();
  if (Object.keys(pr) && pr.length > 0) {
    allPrs.push(pr);
  }
  //pagination (if needed)
  const prLinks = await prRaw.headers.get('Link'); //e.g. <https://api.github.com/repositories/10851820/pulls?per_page=30&page=2>; rel="next", <https://api.github.com/repositories/10851820/pulls?per_page=30&page=4>; rel="last"
  if (prLinks) {
    const linkArray = prLinks.split(",");
    const match = linkArray.filter(link => link.includes('rel="next"')); //e.g. <https://api.github.com/repositories/10851820/pulls?per_page=30&page=2>; rel="next"
    if (Object.keys(match) && match.length === 1) {
      const matchStr = match[0];
      const startChar = matchStr.indexOf("<");
      const endChar = matchStr.indexOf(">");
      const nextUrl = matchStr.substring(startChar+1, endChar); //strip out url string between < and >
      const nextPr = await getPrData(nextUrl, auth);
      allPrs.push(nextPr);
    }
  }
  return allPrs;
};

//send a error status with relevant error text
const sendHttpStatus = (res, status, text) => {
  res.status(status).send(`${text}`);
};

app.listen(port, () => {
  console.log(`Redox app listening at http://localhost:${port}`);
});
