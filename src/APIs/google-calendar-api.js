"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.GoogleCalendarAPI = void 0;
var dotenv = require("dotenv");
var googleapis_1 = require("googleapis");
var simple_node_logger_1 = require("simple-node-logger");
var dayjs = require("dayjs");
dotenv.config();
var oAuth2Client = new googleapis_1.google.auth.OAuth2(process.env.GCAL_CLIENT_ID, process.env.GCAL_CLIENT_SECRET, process.env.GCAL_REDIRECT_URI);
oAuth2Client.setCredentials({
    refresh_token: process.env.GCAL_REFRESH_TOKEN
});
googleapis_1.google.options({
    auth: oAuth2Client
});
var GoogleCalendarAPIError = /** @class */ (function (_super) {
    __extends(GoogleCalendarAPIError, _super);
    function GoogleCalendarAPIError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return GoogleCalendarAPIError;
}(Error));
var GoogleCalendarAPI = /** @class */ (function () {
    function GoogleCalendarAPI(jobName) {
        if (jobName === void 0) { jobName = 'No Job Name'; }
        this.jobName = jobName;
        this.logger = simple_node_logger_1["default"].createSimpleLogger('logs/google-calendar-api.log');
        this.google = googleapis_1.google;
        this.logger.log('info', jobName + ": starting Google Calendar logger");
    }
    GoogleCalendarAPI.prototype.shouldWeSyncEvent = function (event) {
        if (event.summary.startsWith('.')) {
            return false;
        }
        else {
            return true;
        }
    };
    GoogleCalendarAPI.prototype.getTodaysFilteredCalendarEvents = function () {
        return __awaiter(this, void 0, void 0, function () {
            var accessToken, calendar, dayStart, dayEnd, response, events, filteredEvents, error_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, oAuth2Client.getAccessToken()
                            // const calendar = google.calendar({ version: 'v3', oAuth2Client })
                        ];
                    case 1:
                        accessToken = _a.sent();
                        calendar = googleapis_1.google.calendar({ version: 'v3' });
                        dayStart = dayjs().startOf('day').toISOString();
                        dayEnd = dayjs().endOf('day').toISOString();
                        return [4 /*yield*/, calendar.events.list({
                                calendarId: 'primary',
                                timeMin: dayStart,
                                timeMax: dayEnd,
                                maxResults: 15,
                                singleEvents: true,
                                orderBy: 'startTime'
                            })];
                    case 2:
                        response = _a.sent();
                        events = response.data.items;
                        filteredEvents = events.filter(function (e) { return _this.shouldWeSyncEvent(e); });
                        return [2 /*return*/, filteredEvents];
                    case 3:
                        error_1 = _a.sent();
                        this.logger.log('error', this.jobName + " GoogleCalendarAPI [getTodaysCalendarEvents] error: " +
                            error_1);
                        return [2 /*return*/, []];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return GoogleCalendarAPI;
}());
exports.GoogleCalendarAPI = GoogleCalendarAPI;
exports["default"] = GoogleCalendarAPI;
