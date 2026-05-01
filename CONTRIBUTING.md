# Contributing to Lending Marketplace

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/lending-marketplace.git`
3. Create a feature branch: `git checkout -b feature/amazing-feature`
4. Follow the setup instructions in SETUP.md

## Development Workflow

### Before Starting
- Check existing issues and PRs to avoid duplication
- Create an issue to discuss major changes

### Code Style
- Use consistent formatting (2-space indentation)
- Add comments for complex logic
- Follow existing code patterns
- Run linter before submitting: `npm run lint` (when available)

### Commit Messages
- Use clear, descriptive messages
- Start with a verb: "Add", "Fix", "Update", "Refactor"
- Example: "Add collateral verification endpoint"

### Testing
- Test your changes thoroughly
- Update tests if modifying existing functionality
- Document any new environment variables

## Areas to Contribute

### High Priority
- [ ] Authentication middleware for all protected routes
- [ ] Input validation with express-validator
- [ ] Error handling improvements
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Unit tests for models and routes

### Medium Priority
- [ ] Payment gateway integration (Stripe/Razorpay)
- [ ] Email notifications
- [ ] Image upload for collateral
- [ ] Advanced search and filtering
- [ ] User ratings and reviews

### Low Priority
- [ ] Dark mode UI
- [ ] Internationalization (i18n)
- [ ] Additional language support
- [ ] Performance optimizations
- [ ] Analytics dashboard

## Pull Request Process

1. Update the README.md with any new features
2. Update SETUP.md if adding dependencies or environment variables
3. Ensure code follows project style guidelines
4. Submit PR with clear description of changes
5. Link related issues using "Closes #issue_number"

## Reporting Bugs

**Issue Title:** Brief description of the bug

**Description:**
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots (if UI-related)
- Environment info (OS, Node version, etc.)

## Suggesting Enhancements

**Issue Title:** Brief feature description

**Description:**
- Reason for the feature
- Example use cases
- Possible implementation approach

## Questions?

- Check existing issues and discussions
- Review SETUP.md troubleshooting section
- Create a GitHub discussion

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Help others learn and grow
- Report harassment to project maintainers

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for helping make Lending Marketplace better! 🙏
