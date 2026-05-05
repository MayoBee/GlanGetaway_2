"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RebookingToken = exports.WeatherAlert = exports.WeatherTrigger = void 0;
// Backwards compatibility - re-export from domain structure
var weather_trigger_1 = require("../domains/admin/models/weather-trigger");
Object.defineProperty(exports, "WeatherTrigger", { enumerable: true, get: function () { return weather_trigger_1.WeatherTrigger; } });
Object.defineProperty(exports, "WeatherAlert", { enumerable: true, get: function () { return weather_trigger_1.WeatherAlert; } });
Object.defineProperty(exports, "RebookingToken", { enumerable: true, get: function () { return weather_trigger_1.RebookingToken; } });
