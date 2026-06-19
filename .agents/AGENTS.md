# Custom Agent Rules for Code Scaffold

* **GitHub Actions Validation:** After executing a `git push` to the remote repository, you MUST proactively validate that the resulting GitHub Action pipeline completes successfully before considering the task finished. Wait for the action to complete and verify its success state.
