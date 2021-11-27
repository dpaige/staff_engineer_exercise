# Staff Engineer Exercise

## Project Details

> For the coding task, we'll build a tool to analyze pull request traffic for a Github organization.
For the part you do on your own: write some code that will retrieve every pull request for the Ramda organization using the Github web API and store the results in memory. When we pair, we will use this collection of pull requests for analysis of things like patterns across PRs of different statuses. For example, we might answer a question like "how many pull requests were merged week over week across the organization?”

## Reference sites

- https://github.com/orgs/ramda/repositories
- https://docs.github.com/en/rest/guides/basics-of-authentication
- https://docs.github.com/en/rest/reference/repos
- https://docs.github.com/en/rest/reference/pulls
- https://docs.github.com/en/rest/guides/traversing-with-pagination

## Technical Details

This is a simple Node.js app, using Express and Node Fetch to perform relevant HTTP requests.

`configs.json` file contains the following options:
```
{
  "username": "dpaige",
  "token": "[_OBSCURED_]",
  "org": "ramda",
  "baseUrl": "https://api.github.com",
  "reposType": "all",
  "reposPerPage": "100",
  "pullsState": "all",
  "pullsPerPage": "100"
}
```
- `reposType` options: all, public, private, forks, sources, member, internal
- `pullsState` options: open, closed, or all
- `reposPerPage` and `pullsPerPage` options: 1 to 100 (inclusive). Set to 100 on `pullsPerPage` for better efficiency on repos with many PRs (e.g. `ramda`)

## Instructions

- Start the server by entering: `node app.js`
- Send a GET request to: http://localhost:3000/prs
