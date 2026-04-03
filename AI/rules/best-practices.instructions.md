---
description: Use this instruction before generating any code to ensure that the code adheres to best practices.
paths: ["src/**/*.ts"]
---

# Performance-first implementation instruction
- For every code implementation, prioritize performance by selecting the most efficient algorithmic approach that solves the requirement correctly and with minimal resource usage.
- Avoid unnecessary intermediate allocations, repeated work, and unbounded loops.
- Prefer native, efficient data structures and APIs for the platform (e.g., iterator-based processing, lazy evaluation, built-in batch operations) when available.
- Explicitly note if tradeoffs are made for readability or maintainability versus peak performance.

# Object-oriented design and patterns
- When designing new components, prefer clean object-oriented design and apply an established design pattern (e.g., Strategy, Factory, Adapter, Observer, Command) if it helps make the solution modular and maintainable.
- Call out the chosen pattern in comments or PR descriptions and explain why it fits this case.

# Readability and maintainability
- Write clear, self-explanatory code with meaningful variable and function names.
- Include comments to explain non-obvious logic, assumptions, and tradeoffs. No unnecessary comments that state the obvious. This is not a tutorial project, so assume the reader has a solid understanding of the language and common patterns.
- Structure code in a way that is easy to navigate and understand for future maintainers.

# PRD compliance
- PRD for the project is located in the "docs" folder. Ensure that all implementations fully meet the requirements outlined in the PRD.
- The docs folder also contains a system architectural diagram

# Code implementation
- Don't write a single line of code without clarity, ask me questions if you're not sure what part to take. No unnecesarry assumptions
