

<!-- stage-36-world-state-system -->
# Stage 36 Design System

## Direction

World State / Technical Specimen

The visual system treats a Minecraft Bedrock world as an inspectable technical system. It uses world slices, selection volumes, path traces, build layers, tick states, counters, command effects, and verified addon relationships.

## Hero capability source

The mutable hero labels live in `lib/design/homepage.ts`.

Default first capability: `Read world state`

## Shape and type

- precise planes and structured dividers
- restrained radius
- no broad purple gradients
- no glow-heavy containers
- no nested card walls
- no decorative pills around ordinary text
- body text stays at or above 16px where practical
- monospace is reserved for commands, paths, versions, rules, and API names
- visible keyboard focus and 44px minimum controls
- no hover-only information
- reduced-motion state remains complete

## Homepage order

1. capability-controlled world specimen
2. complete repository index
3. Canopy flagship
4. extensions
5. building workflow
6. server tooling
7. developer infrastructure
8. feature and documentation bridge
9. source access

<!-- stage-36c-featured-project-stories -->
## Stage 36C featured project stories

The homepage now continues from the mutable hero and complete repository index into six authored project stories:

1. Canopy flagship instrumentation
2. Understudy and Statistic Display
3. Construct and Nudge
4. Boreal server control
5. AddonAPIKit, minecraft-vitest-mocks, and Canopy Extension Example
6. Feature, documentation, archive, and search destinations

The previous lower homepage remains in source behind `NEXT_PUBLIC_STAGE36_LEGACY_HOME=1` for one transition stage. It is not rendered by default. Stage 36D may remove that source after the rendered replacement is accepted.
