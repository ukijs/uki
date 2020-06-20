Developing
==========

# Other magic I'm considering adding:
- Promise-ifying `.trigger()` calls so that you can know when everyone has
  finished responding to an event?
- Support non-absolute resource paths; can probably use new es2020 import.meta?

# Documentation TODOs:
- implement a full force-directed example
- create / generate API jsdocs

# Releasing a new version
A list of reminders to make sure I don't forget any steps:

- Update the version in package.json
- `npm run build`
- Run each example (TODO: automated testing?)
- `git add -A`
- `git commit -m "commit message"`
- `git tag -a #.#.# -m "tag annotation"`
- `git push --tags`
- `npm publish`
- (maybe optional) Edit / document the release on Github
