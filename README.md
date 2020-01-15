# Constellation Control

Constellation Control is a turn-based 4X space strategy game that runs in a web browser. It is free, open-source, serverless, runs entirely client-side, and uses only HTML, CSS, and javascript.

Project Home: https://www.leiavoia.net/cc/ 

Play It Now! https://www.leiavoia.net/cc/x/

Documentation: https://www.leiavoia.net/cc/x/doc/
* [How To Play](https://www.leiavoia.net/cc/x/doc/how-to-play.html)
* [About](https://www.leiavoia.net/cc/x/doc/about.html)
* [FAQ](https://www.leiavoia.net/cc/x/doc/faq.html)


## Prerequisites

* Node >= 8.9.0
* NPM >= 5.6.0

If you don't already have a working NodeJS development environment, install that first:

https://nodejs.org/


## Installation

```
git clone https://github.com/leiavoia/cc.git cc;
npm install aurelia-cli -g;
cd cc;
npm install;
```

This project is bootstrapped by [aurelia-cli](https://github.com/aurelia/cli). For more information, visit https://aurelia.io/docs/cli/cli-bundler

### Building

```
au run --watch
```

Then open `http://localhost:9000`

For bundled production builds:
```
au build --env prod
```

## Deployment

Just copy the project folder to a website without the "node_modules" folder. This is not necessary to play the game. You can run the game directly from localhost:9000.

## Authors

Concept, design, programming, and hosting by leiavoia.

## Contributing

Want to help? We could use:

* Sci-fi writers
* Beta testers
* Space ship art
* Race portrait painters
* Legal fetch quests (getting permission to use other creator's work).

Contributions to the project may receive compensation and do not require exclusive licensing terms.

Contact leiavoia at cc@leiavoia.net for more information.

## Versioning

We use [SemVer](http://semver.org/) for versioning. (Major.Minor.Build).

Builds may fix bugs, update AI behavior, or add small features.

Minor releases will add new features which may break saved game files.

Major releases are for stable builds that fundamentally alter game play.

## License

Source code for this project is licensed under the Apache License 2.0. See the [LICENSE.txt](LICENSE.txt) file for details.

Art assets contained by this project are not covered by this license and may be separately licensed from content creators.

"Constellation Control" is a trademark and use of the term is prohibited. This means that you can copy and distribute the source code, but you may not build it into an app called "Constellation Control".

## Acknowledgments

Planet images: [hoevelkamp](https://www.deviantart.com/hoevelkamp), 
[macrebisz](https://www.deviantart.com/macrebisz)

Spaceships: [MilllionthVector](http://millionthvector.blogspot.com/)

Source material for map background compositions: NASA, ESA, Space Telescope Science Institute, Hubble Space Telescope Orion Treasury Project Team, Hubble Heritage Team (AURA/STScI), R. Gendler, J. GaBany, Josh Barrington, M. Robberto
 