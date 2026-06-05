// Renderer entry. ES modules are deferred by default, so by the time this
// runs the DOM is parsed and the modules below can safely query elements.
import { render, say } from "./view.js";
import { startLife } from "./life.js";
import { startIdle } from "./reactions.js";
import { wireInteractions } from "./interactions.js";
import { wireBridge } from "./bridge.js";
import { enableDrag } from "./drag.js";

wireBridge();
wireInteractions();
enableDrag();
startLife();
startIdle();

render();
setTimeout(() => say("Hi! I'm Pip 👋"), 400);
