# AI-Powered Code Review System

An AI-powered code review system that reviews GitHub/GitLab PR's & MR's and provides feedback on code changes.


## Features

- Review GitHub Pull Requests
- Analyze code changes using AI
- Identify code issues and suggest improvements
- Generate code fixes for review findings
- Generate regex patterns for custom review rules
- Post review comments back to the Pull Request


## How It Works

1. Enter a GitHub/GitLab Pull Request or Merge Request URL.
2. Click **Review** to analyze the code changes.
3. The system fetches the Pull Request changes.
4. AI analyzes the code and generates review feedback.
5. Review results are displayed in the application.
6. Generated comments can be posted back to the GitHub/GitLab Pull Request or Merge Request.


## AI Integration

The project uses the **Groq API** with the **Llama 3.3 70B** model.

AI is used for:
- Generating code fixes based on review findings.
- Suggesting regex patterns for custom code review rules.
