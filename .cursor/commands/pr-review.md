---
description: Review a GitHub Pull Request and post inline comments following repository review rules
---

## PR Review Command

This command reviews a GitHub Pull Request, analyzes code changes, and posts inline comments using GitHub API.

## User Input

$ARGUMENTSThe user should provide a GitHub PR URL or PR number.
Examples:
- `https://github.com/owner/repo/pull/27`
- `27`
- `owner/repo#27`

## Execution Steps

1. **Parse PR Information**
   - Extract PR number and repository from `$ARGUMENTS`
   - If URL is provided (e.g., `https://github.com/magcho/books_arika/pull/27`), extract PR number and repo
   - If only number is provided (e.g., `27`), use current repository from git config
   - If format is `owner/repo#27`, parse accordingly

2. **Get PR Details**
   
   # Get PR information
   gh pr view $PR_NUMBER --json title,body,headRefName,baseRefName,files,headRefOid,baseRefOid
   
   # Get changed files
   gh pr diff $PR_NUMBER --name-only
   
   # Get full diff
   gh pr diff $PR_NUMBER
   3. **Review Process**
   - Analyze all changed files
   - Check code quality, security, error handling, test coverage
   - Identify issues and categorize by priority:
     - 🔴 **必須修正**: Critical issues that must be fixed (security, bugs, breaking changes)
     - 🟡 **推奨改善**: Recommended improvements (code quality, maintainability)
     - 🟢 **軽微な改善**: Minor improvements (documentation, naming)

4. **Review Checklist**
   Check against these criteria:
   - [ ] **Security**: Appropriate validation and authorization checks
   - [ ] **Error handling**: Appropriate error messages and exception handling
   - [ ] **Code quality**: Readability, maintainability, consistency
   - [ ] **Test coverage**: Sufficient test cases for new functionality
   - [ ] **Performance**: Unnecessary queries or operations
   - [ ] **Documentation**: Comments and documentation are clear
   - [ ] **Type safety**: TypeScript types are properly used
   - [ ] **Best practices**: Follows repository conventions

5. **Post Inline Comments**
   For each issue found:
   gh api repos/{owner}/{repo}/pulls/{pr_number}/comments --method POST \
     --field body='[Priority] **Title**: [Description]
   
   **問題**: [What is the problem]
   
   **修正案**: [Suggested fix with code example if applicable]' \
     --field path='[file_path]' \
     --field commit_id='[commit_sha]' \
     --field line=[line_number] \
     --field side='RIGHT'
      
   Comment format:
   - Start with priority emoji and title
   - Describe the problem clearly
   - Provide solution with code example if applicable
   - Use code blocks for code examples

6. **Post Summary Comment**
   gh pr comment $PR_NUMBER --body-file [summary_file.md]
      Summary should include:
   - Overall assessment
   - Good points
   - Required fixes (🔴)
   - Recommended improvements (🟡)
   - Minor improvements (🟢)
   - Final status (✅ 承認可能 / ❌ 承認不可 / ⚠️ 条件付き承認)

7. **Cleanup**
   - Delete temporary review files (summary files, comment files)
   - Only keep files if user explicitly requests with reason

## Review Rules (from repository)

Follow these rules from the repository:
- **Use GitHub inline comments**: Post comments directly to PR using GitHub API
- **Post summary comment**: Post overall review summary as regular PR comment
- **Delete temporary files**: Review files should be deleted by default
- **Ask before committing**: Only commit review files if user explicitly requests with reason

## Priority Guidelines

- 🔴 **必須修正**: 
  - Security vulnerabilities
  - Bugs that cause incorrect behavior
  - Breaking changes
  - Missing critical functionality
  - Files that shouldn't be committed (e.g., `.cursor/worktrees.json`)

- 🟡 **推奨改善**:
  - Code duplication
  - Code quality improvements
  - Test improvements
  - Documentation improvements
  - Performance optimizations

- 🟢 **軽微な改善**:
  - Naming improvements
  - Comment improvements
  - Formatting improvements
  - Minor refactoring suggestions

## Example Review Flow

1. Parse input: `27` → PR number 27, repo from git config
2. Get PR info: Title, files changed, commit SHA
3. Review each file:
   - Read file content
   - Analyze changes
   - Identify issues
4. Post inline comments for each issue
5. Create summary with:
   - Good points
   - Required fixes
   - Recommended improvements
   - Final status
6. Post summary comment
7. Delete temporary files

## Notes

- Always respond in 日本語 (Japanese)
- Be thorough but constructive
- Focus on actionable feedback
- Acknowledge good practices
- Provide code examples for fixes when possible