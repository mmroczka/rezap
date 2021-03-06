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
exports.NotionAPI = void 0;
var client_1 = require("@notionhq/client");
var simple_node_logger_1 = require("simple-node-logger");
var constants_config_1 = require("../constants.config");
var NotionAPIError = /** @class */ (function (_super) {
    __extends(NotionAPIError, _super);
    function NotionAPIError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return NotionAPIError;
}(Error));
var NotionAPI = /** @class */ (function () {
    function NotionAPI(jobName) {
        if (jobName === void 0) { jobName = 'No Job Name'; }
        this.jobName = jobName;
        this.notion = new client_1.Client({ auth: process.env.NOTION_KEY });
        this.logger = simple_node_logger_1["default"].createSimpleLogger('logs/notion-api.log');
        this.logger.log('info', jobName + ": starting Notion logger");
    }
    NotionAPI.prototype.retrieveDatabase = function (databaseId) {
        return __awaiter(this, void 0, void 0, function () {
            var response, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.notion.databases.retrieve({
                                database_id: databaseId
                            })];
                    case 1:
                        response = _a.sent();
                        if (!response) {
                            throw new NotionAPIError('issue retrieving database from Notion');
                        }
                        return [2 /*return*/, response];
                    case 2:
                        e_1 = _a.sent();
                        this.logger.log('error', 'NotionAPI [retrieveDatabase] ' + e_1);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    NotionAPI.prototype.findGoogleCalendarEventByURL = function (url) {
        return __awaiter(this, void 0, void 0, function () {
            var queryFilterSelectFilterTypeBased, matchingSelectResults, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        queryFilterSelectFilterTypeBased = {
                            property: 'URL',
                            text: {
                                contains: url
                            }
                        };
                        return [4 /*yield*/, this.notion.databases.query({
                                database_id: constants_config_1["default"].NOTION_TASKS_DB_ID,
                                filter: queryFilterSelectFilterTypeBased
                            })];
                    case 1:
                        matchingSelectResults = _a.sent();
                        return [2 /*return*/, matchingSelectResults.results[0] || undefined];
                    case 2:
                        error_1 = _a.sent();
                        this.logger.log('error', "[findGoogleCalendarEventByURL]: " + error_1);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    NotionAPI.prototype.findHighlightById = function (highlightId) {
        return __awaiter(this, void 0, void 0, function () {
            var queryFilterSelectFilterTypeBased, matchingSelectResults, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        queryFilterSelectFilterTypeBased = {
                            property: 'Rescue Time ID',
                            number: {
                                equals: highlightId
                            }
                        };
                        return [4 /*yield*/, this.notion.databases.query({
                                database_id: constants_config_1["default"].NOTION_RESCUE_TIME_HIGHLIGHTS_DB_ID,
                                filter: queryFilterSelectFilterTypeBased
                            })];
                    case 1:
                        matchingSelectResults = _a.sent();
                        return [2 /*return*/, matchingSelectResults.results[0] || undefined];
                    case 2:
                        err_1 = _a.sent();
                        this.logger.log('error', "[findHighlightById]: " + err_1);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    NotionAPI.prototype.convertRescueTimeHighlightToNotionPage = function (highlight) {
        var parent = {
            database_id: constants_config_1["default"].NOTION_RESCUE_TIME_HIGHLIGHTS_DB_ID
        };
        var properties = {
            Description: {
                title: [
                    {
                        text: {
                            content: highlight.description
                        }
                    },
                ]
            },
            'Rescue Time ID': {
                number: highlight.id
            },
            Date: {
                date: {
                    start: highlight.created_at
                }
            }
        };
        var page = {
            parent: parent,
            properties: properties
        };
        this.logger.log('info', 'successfully converted highlight to Notion page');
        return page;
    };
    NotionAPI.prototype.convertCalendarEventToNotionPage = function (event) {
        var startTime = event.start.dateTime;
        var endTime = event.end.dateTime;
        var parent = {
            database_id: constants_config_1["default"].NOTION_TASKS_DB_ID
        };
        var properties = {
            'Action Item': {
                title: [
                    {
                        text: {
                            content: event.summary
                        }
                    },
                ]
            },
            Priority: {
                select: {
                    name: 'Scheduled ????'
                }
            },
            Status: {
                select: {
                    name: 'Active'
                }
            },
            'Do Date': {
                date: {
                    start: startTime,
                    end: endTime
                }
            },
            URL: {
                url: event.htmlLink
            }
        };
        var page = {
            parent: parent,
            properties: properties
        };
        this.logger.log('info', 'successfully converted highlight to Notion page');
        return page;
    };
    NotionAPI.prototype.createPageInDatabase = function (page) {
        return __awaiter(this, void 0, void 0, function () {
            var response, e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        this.logger.log('info', 'creating page in notion...');
                        return [4 /*yield*/, this.notion.pages.create(page)];
                    case 1:
                        response = _a.sent();
                        this.logger.log('info', 'created page in notion successfully');
                        if (!response) {
                            throw new NotionAPIError('issue with creating page in the Notion database');
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        e_2 = _a.sent();
                        this.logger.log('error', 'NotionAPI [createPageInDatabase] error attempting to add to notion database this page: ' +
                            page);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return NotionAPI;
}());
exports.NotionAPI = NotionAPI;
exports["default"] = NotionAPI;
