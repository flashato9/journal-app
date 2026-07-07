---
name: document-folder-purpose
description: Explore a folder, generate a one-sentence purpose question, and add it to code-knowledge.md
---

# Document Folder Purpose Skill

## Goal

For a given folder, create a one-sentence question that explains its purpose, then add it to `code-knowledge.md` with examples.

## Process

1. **Read existing knowledge**
   - Read `code-knowledge.md` to understand what we already know about the repository

2. **Breadth-first exploration**
   - Use Glob to list all files in the target folder recursively
   - Read all text-based files (skip binary files like images)
   - Read in this order: README/documentation files first, then config files, then generated/cache files

3. **Synthesize findings**
   - Summarize what each file does
   - Identify the core purpose of the folder
   - Consider how it fits with the rest of the repository context

4. **Generate one-sentence question**
   - Write a single question that, when answered, explains why this folder exists
   - Format: "How/What/Why does [tool/framework] [action]?"
   - Make it concrete and specific to this project

5. **Create Examples section**
   - Add 2-3 bullet points with concrete examples from the actual files
   - Explain technical concepts in plain language
   - Reference actual files/data found in the folder

6. **Update code-knowledge.md**
   - Add the folder as an H1 heading
   - Add "Purpose" bullet with the one-sentence question
   - Add "Examples" bullet with the example sub-bullets

## Output Format in code-knowledge.md

```
# [folder-name]

- Purpose
  - [One-sentence question about why this folder exists]
- Examples
  - [Example 1 explaining a concrete file/concept]
  - [Example 2 explaining a concrete file/concept]
  - [Example 3 explaining a concrete file/concept]
```
