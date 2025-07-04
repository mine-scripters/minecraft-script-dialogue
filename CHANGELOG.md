# Changelog

## [2.0.0](https://github.com/mine-scripters/minecraft-script-dialogue/compare/v1.1.5...v2.0.0) (2025-07-04)


### ⚠ BREAKING CHANGES

* Use the input options for each type
* Adding support for submitButton, divider, label and header

### Features

* Adding support for submitButton, divider, label and header ([91c1445](https://github.com/mine-scripters/minecraft-script-dialogue/commit/91c144573eb361024562a4e499472325b13e5847))
* Use the input options for each type ([325ff75](https://github.com/mine-scripters/minecraft-script-dialogue/commit/325ff75718861133df80229aedfa6ea24d7d70f9))


### Bug Fixes

* add exports of ui elements in index.ts ([f7dfa8a](https://github.com/mine-scripters/minecraft-script-dialogue/commit/f7dfa8a98cd65f6e007d9030519d5971a58c9c64))
* Allows to pass new ui elements using addElements functions ([bc331d3](https://github.com/mine-scripters/minecraft-script-dialogue/commit/bc331d3c078cca522ddbf6f2d78beecb1e0eb6e8))
* Since 1.21.80.26, it counts the divider/header/label as spaces in the values ([dfad771](https://github.com/mine-scripters/minecraft-script-dialogue/commit/dfad7712589cfec9e05cc32c819712c0dccf20bc))

## [1.1.5](https://github.com/mine-scripters/minecraft-script-dialogue/compare/v1.1.4...v1.1.5) (2024-05-01)


### Bug Fixes

* Prevents the player from getting stuck if killed while on a dialog ([#35](https://github.com/mine-scripters/minecraft-script-dialogue/issues/35)) ([9b480b2](https://github.com/mine-scripters/minecraft-script-dialogue/commit/9b480b253e03553a03bdf46673fe8579a2db461e))
* Validates dropdown before sending it ([#36](https://github.com/mine-scripters/minecraft-script-dialogue/issues/36)) ([e52dc8b](https://github.com/mine-scripters/minecraft-script-dialogue/commit/e52dc8b0c798d7d8f5df5ed9e45ec3206c6e7149)), closes [#26](https://github.com/mine-scripters/minecraft-script-dialogue/issues/26)

## [1.1.4](https://github.com/mine-scripters/minecraft-script-dialogue/compare/v1.1.3...v1.1.4) (2024-04-15)


### Bug Fixes

* Force release ([8a20ef7](https://github.com/mine-scripters/minecraft-script-dialogue/commit/8a20ef77bcba4e15a29e1a45e499f86d1b2c96bd))

## [1.1.3](https://github.com/mine-scripters/minecraft-script-dialogue/compare/v1.1.2...v1.1.3) (2024-02-02)


### Bug Fixes

* Adds all the versions to peerdeps to silence warns ([#31](https://github.com/mine-scripters/minecraft-script-dialogue/issues/31)) ([408fca0](https://github.com/mine-scripters/minecraft-script-dialogue/commit/408fca0719fe941e8e9e040c20bdea6b7f51628f))

## [1.1.2](https://github.com/mine-scripters/minecraft-script-dialogue/compare/v1.1.1...v1.1.2) (2024-02-02)


### Bug Fixes

* Moved minecraft to peer-dependencies ([#28](https://github.com/mine-scripters/minecraft-script-dialogue/issues/28)) ([36268d9](https://github.com/mine-scripters/minecraft-script-dialogue/commit/36268d9d043a35e42a12686371c2a2c2578c7230))

## [1.1.1](https://github.com/mine-scripters/minecraft-script-dialogue/compare/v1.1.0...v1.1.1) (2024-02-01)


### Bug Fixes

* add quotes to players when running lock commands ([7af8632](https://github.com/mine-scripters/minecraft-script-dialogue/commit/7af863292bed62de08d2b8726dd9f86ae3629d29))

## [1.1.0](https://github.com/mine-scripters/minecraft-script-dialogue/compare/v1.0.0...v1.1.0) (2024-01-17)


### Features

* Callback buttons can now return a value ([#22](https://github.com/mine-scripters/minecraft-script-dialogue/issues/22)) ([913dfb7](https://github.com/mine-scripters/minecraft-script-dialogue/commit/913dfb760ed11f1bf6f8a6aa35e7583feda3b6fa))

## 1.0.0 (2024-01-13)


### Bug Fixes

* Fix translate and inputDialogueresponse values ([6a4b181](https://github.com/mine-scripters/minecraft-script-dialogue/commit/6a4b18177d33733d051794b7edd9c5c898464b98))
* Prevents the creation of dialogues without elements ([#20](https://github.com/mine-scripters/minecraft-script-dialogue/issues/20)) ([f3f4217](https://github.com/mine-scripters/minecraft-script-dialogue/commit/f3f42174e60b38b1b95f5a0ecb108b4e41af37f4)), closes [#16](https://github.com/mine-scripters/minecraft-script-dialogue/issues/16)
