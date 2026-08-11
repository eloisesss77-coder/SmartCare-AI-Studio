"use strict";
(wx["webpackJsonp"] = wx["webpackJsonp"] || []).push([["common"],{

/***/ "./src/services/api.ts":
/*!*****************************!*\
  !*** ./src/services/api.ts ***!
  \*****************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getAlertDetail: function() { return /* binding */ getAlertDetail; },
/* harmony export */   getAlertList: function() { return /* binding */ getAlertList; },
/* harmony export */   getDailyReports: function() { return /* binding */ getDailyReports; },
/* harmony export */   getElderlyDetail: function() { return /* binding */ getElderlyDetail; },
/* harmony export */   getElderlyRadarData: function() { return /* binding */ getElderlyRadarData; },
/* harmony export */   getMyElderly: function() { return /* binding */ getMyElderly; },
/* harmony export */   handleAlert: function() { return /* binding */ handleAlert; },
/* harmony export */   setLoginReady: function() { return /* binding */ setLoginReady; },
/* harmony export */   useBindCode: function() { return /* binding */ useBindCode; }
/* harmony export */ });
/* unused harmony exports familyLogin, getRadarHistory, unbindElderly */
/* harmony import */ var D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/slicedToArray.js */ "./node_modules/@babel/runtime/helpers/esm/slicedToArray.js");
/* harmony import */ var D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/objectSpread2.js */ "./node_modules/@babel/runtime/helpers/esm/objectSpread2.js");
/* harmony import */ var D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/regenerator.js */ "./node_modules/@babel/runtime/helpers/esm/regenerator.js");
/* harmony import */ var D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ "./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tarojs/taro */ "./node_modules/@tarojs/taro/index.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_tarojs_taro__WEBPACK_IMPORTED_MODULE_0__);




/** API 服务层 — 封装所有后端接口 */

/** 后端基础 URL（需在小程序后台配置 request 合法域名） */
var BASE_URL = 'https://anban.org.cn/api/v1';

// 注意：微信开发者工具中开发测试可关闭「不校验合法域名」
// 正式版需在小程序后台配置 request 合法域名为 anban.org.cn

// ---------- 认证竞态控制 ----------

var _loginReady = false;

/** app.tsx 登录完成后调用，通知 api 层可以安全发请求 */
function setLoginReady() {
  _loginReady = true;
}

/** 等待登录完成（最多等 10 秒），确保 familyId 已写入 storage */
function ensureAuth() {
  return _ensureAuth.apply(this, arguments);
} // ---------- Storage 工具 ----------
/** 获取本地存储的 familyId */
function _ensureAuth() {
  _ensureAuth = (0,D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().m(function _callee() {
    var i;
    return (0,D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().w(function (_context) {
      while (1) switch (_context.n) {
        case 0:
          if (!_loginReady) {
            _context.n = 1;
            break;
          }
          return _context.a(2);
        case 1:
          i = 0;
        case 2:
          if (!(i < 40)) {
            _context.n = 5;
            break;
          }
          if (!(_loginReady || _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().getStorageSync('familyId'))) {
            _context.n = 3;
            break;
          }
          return _context.a(2);
        case 3:
          _context.n = 4;
          return new Promise(function (r) {
            return setTimeout(r, 250);
          });
        case 4:
          i++;
          _context.n = 2;
          break;
        case 5:
          return _context.a(2);
      }
    }, _callee);
  }));
  return _ensureAuth.apply(this, arguments);
}
function getFamilyId() {
  return _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().getStorageSync('familyId') || '';
}

/** 获取本地存储的 token */
function getToken() {
  return _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().getStorageSync('token') || '';
}

// ---------- 请求封装 ----------

/** 通用请求封装 */
function request(_x) {
  return _request.apply(this, arguments);
} // ===================== 登录 =====================
/** 微信登录：wx.login 获取 code → 后端换取 openid */
function _request() {
  _request = (0,D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().m(function _callee2(path) {
    var options,
      _options$method,
      method,
      data,
      _options$header,
      header,
      _options$needAuth,
      needAuth,
      res,
      _body,
      _msg,
      body,
      msg,
      _args2 = arguments;
    return (0,D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().w(function (_context2) {
      while (1) switch (_context2.n) {
        case 0:
          options = _args2.length > 1 && _args2[1] !== undefined ? _args2[1] : {};
          _options$method = options.method, method = _options$method === void 0 ? 'GET' : _options$method, data = options.data, _options$header = options.header, header = _options$header === void 0 ? {} : _options$header, _options$needAuth = options.needAuth, needAuth = _options$needAuth === void 0 ? true : _options$needAuth;
          if (!needAuth) {
            _context2.n = 1;
            break;
          }
          _context2.n = 1;
          return ensureAuth();
        case 1:
          _context2.n = 2;
          return _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().request({
            url: "".concat(BASE_URL).concat(path),
            method: method,
            data: data,
            header: (0,D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_3__["default"])({
              'Content-Type': 'application/json',
              'X-Family-Id': getFamilyId(),
              Authorization: "Bearer ".concat(getToken())
            }, header)
          });
        case 2:
          res = _context2.v;
          if (!(res.statusCode >= 200 && res.statusCode < 300)) {
            _context2.n = 5;
            break;
          }
          _body = res.data; // 业务层 code 字段检查：code 存在且不为 0/200 时视为业务错误
          if (!(_body && typeof _body.code === 'number' && _body.code !== 0 && _body.code !== 200)) {
            _context2.n = 4;
            break;
          }
          if (!(_body.code === 401 || (_body === null || _body === void 0 ? void 0 : _body.detail) === 'Not authenticated')) {
            _context2.n = 3;
            break;
          }
          _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().showToast({
            title: '登录已过期，请重启小程序',
            icon: 'none',
            duration: 2500
          });
          throw new Error('认证已过期');
        case 3:
          _msg = _body.message || _body.detail || "\u4E1A\u52A1\u9519\u8BEF(code=".concat(_body.code, ")");
          throw new Error(_msg);
        case 4:
          return _context2.a(2, _body);
        case 5:
          // 提取后端返回的错误信息
          body = res.data;
          msg = (body === null || body === void 0 ? void 0 : body.detail) || (body === null || body === void 0 ? void 0 : body.message) || "\u8BF7\u6C42\u5931\u8D25(".concat(res.statusCode, ")");
          throw new Error(msg);
        case 6:
          return _context2.a(2);
      }
    }, _callee2);
  }));
  return _request.apply(this, arguments);
}
function familyLogin(_x2, _x3) {
  return _familyLogin.apply(this, arguments);
}

// ===================== 首页 =====================

/** 获取当前家属绑定的所有老人 + 实时数据 */
function _familyLogin() {
  _familyLogin = (0,D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().m(function _callee3(code, nickname) {
    return (0,D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().w(function (_context3) {
      while (1) switch (_context3.n) {
        case 0:
          return _context3.a(2, request('/family/register', {
            method: 'POST',
            data: {
              openid: code,
              nickname: nickname || '',
              phone: ''
            },
            needAuth: false
          }));
      }
    }, _callee3);
  }));
  return _familyLogin.apply(this, arguments);
}
function getMyElderly() {
  return _getMyElderly.apply(this, arguments);
}

// ===================== 老人 =====================

/** 老人详情 */
function _getMyElderly() {
  _getMyElderly = (0,D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().m(function _callee4() {
    return (0,D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().w(function (_context4) {
      while (1) switch (_context4.n) {
        case 0:
          return _context4.a(2, request('/family/my-elderly'));
      }
    }, _callee4);
  }));
  return _getMyElderly.apply(this, arguments);
}
function getElderlyDetail(_x4) {
  return _getElderlyDetail.apply(this, arguments);
}

/** 老人最新雷达数据 */
function _getElderlyDetail() {
  _getElderlyDetail = (0,D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().m(function _callee5(id) {
    return (0,D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().w(function (_context5) {
      while (1) switch (_context5.n) {
        case 0:
          return _context5.a(2, request("/family/elderly/".concat(id)));
      }
    }, _callee5);
  }));
  return _getElderlyDetail.apply(this, arguments);
}
function getElderlyRadarData(_x5) {
  return _getElderlyRadarData.apply(this, arguments);
}

/** 老人健康日报 */
function _getElderlyRadarData() {
  _getElderlyRadarData = (0,D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().m(function _callee6(id) {
    return (0,D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().w(function (_context6) {
      while (1) switch (_context6.n) {
        case 0:
          return _context6.a(2, request("/family/elderly/".concat(id, "/radar-data")));
      }
    }, _callee6);
  }));
  return _getElderlyRadarData.apply(this, arguments);
}
function getDailyReports(_x6) {
  return _getDailyReports.apply(this, arguments);
}

/** 雷达历史数据（暂不用） */
function _getDailyReports() {
  _getDailyReports = (0,D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().m(function _callee7(id) {
    var days,
      _args7 = arguments;
    return (0,D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().w(function (_context7) {
      while (1) switch (_context7.n) {
        case 0:
          days = _args7.length > 1 && _args7[1] !== undefined ? _args7[1] : 7;
          return _context7.a(2, request("/family/elderly/".concat(id, "/daily-reports?days=").concat(days)));
      }
    }, _callee7);
  }));
  return _getDailyReports.apply(this, arguments);
}
function getRadarHistory(_x7) {
  return _getRadarHistory.apply(this, arguments);
}

// ===================== 告警 =====================

/** 获取告警列表 */
function _getRadarHistory() {
  _getRadarHistory = (0,D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().m(function _callee8(elderId) {
    var hours,
      _args8 = arguments;
    return (0,D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().w(function (_context8) {
      while (1) switch (_context8.n) {
        case 0:
          hours = _args8.length > 1 && _args8[1] !== undefined ? _args8[1] : 24;
          return _context8.a(2, request("/radar/data/history?elderId=".concat(elderId, "&hours=").concat(hours)));
      }
    }, _callee8);
  }));
  return _getRadarHistory.apply(this, arguments);
}
function getAlertList(_x8) {
  return _getAlertList.apply(this, arguments);
}

/** 告警详情 */
function _getAlertList() {
  _getAlertList = (0,D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().m(function _callee9(params) {
    var query;
    return (0,D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().w(function (_context9) {
      while (1) switch (_context9.n) {
        case 0:
          query = Object.entries(params).filter(function (_ref) {
            var _ref2 = (0,D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_4__["default"])(_ref, 2),
              v = _ref2[1];
            return v !== undefined && v !== '';
          }).map(function (_ref3) {
            var _ref4 = (0,D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_4__["default"])(_ref3, 2),
              k = _ref4[0],
              v = _ref4[1];
            return "".concat(k, "=").concat(v);
          }).join('&');
          return _context9.a(2, request("/family/alerts?".concat(query)));
      }
    }, _callee9);
  }));
  return _getAlertList.apply(this, arguments);
}
function getAlertDetail(_x9) {
  return _getAlertDetail.apply(this, arguments);
}

/** 处理告警（标记已读） */
function _getAlertDetail() {
  _getAlertDetail = (0,D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().m(function _callee0(id) {
    return (0,D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().w(function (_context0) {
      while (1) switch (_context0.n) {
        case 0:
          return _context0.a(2, request("/family/alerts/".concat(id)));
      }
    }, _callee0);
  }));
  return _getAlertDetail.apply(this, arguments);
}
function handleAlert(_x0) {
  return _handleAlert.apply(this, arguments);
}

// ===================== 绑定 =====================

/** 使用绑定码绑定老人 */
function _handleAlert() {
  _handleAlert = (0,D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().m(function _callee1(id) {
    var remark,
      _args1 = arguments;
    return (0,D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().w(function (_context1) {
      while (1) switch (_context1.n) {
        case 0:
          remark = _args1.length > 1 && _args1[1] !== undefined ? _args1[1] : '已阅';
          return _context1.a(2, request("/family/alerts/".concat(id, "/handle"), {
            method: 'PUT',
            data: {
              handledStatus: 2,
              handledBy: '家属',
              handleRemark: remark
            }
          }));
      }
    }, _callee1);
  }));
  return _handleAlert.apply(this, arguments);
}
function useBindCode(_x1) {
  return _useBindCode.apply(this, arguments);
}

/** 解绑老人 */
function _useBindCode() {
  _useBindCode = (0,D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().m(function _callee10(bindCode) {
    var relation,
      _args10 = arguments;
    return (0,D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().w(function (_context10) {
      while (1) switch (_context10.n) {
        case 0:
          relation = _args10.length > 1 && _args10[1] !== undefined ? _args10[1] : '子女';
          return _context10.a(2, request('/family/use-bind-code', {
            method: 'POST',
            data: {
              bindCode: bindCode,
              relation: relation
            }
          }));
      }
    }, _callee10);
  }));
  return _useBindCode.apply(this, arguments);
}
function unbindElderly(_x10) {
  return _unbindElderly.apply(this, arguments);
}
function _unbindElderly() {
  _unbindElderly = (0,D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().m(function _callee11(bindingId) {
    return (0,D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().w(function (_context11) {
      while (1) switch (_context11.n) {
        case 0:
          return _context11.a(2, request("/family/unbind/".concat(bindingId), {
            method: 'DELETE'
          }));
      }
    }, _callee11);
  }));
  return _unbindElderly.apply(this, arguments);
}

/***/ }),

/***/ "./src/utils/format.ts":
/*!*****************************!*\
  !*** ./src/utils/format.ts ***!
  \*****************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   alertLevelColor: function() { return /* binding */ alertLevelColor; },
/* harmony export */   alertLevelLabel: function() { return /* binding */ alertLevelLabel; },
/* harmony export */   alertTypeLabel: function() { return /* binding */ alertTypeLabel; },
/* harmony export */   formatDate: function() { return /* binding */ formatDate; },
/* harmony export */   formatRelativeTime: function() { return /* binding */ formatRelativeTime; },
/* harmony export */   genderLabel: function() { return /* binding */ genderLabel; },
/* harmony export */   handleStatusLabel: function() { return /* binding */ handleStatusLabel; },
/* harmony export */   postureLabel: function() { return /* binding */ postureLabel; }
/* harmony export */ });
/* unused harmony exports formatTime, deviceCategoryLabel */
/** 工具函数 */

/** 格式化时间为相对时间描述 */
function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  var now = Date.now();
  var target = new Date(dateStr.replace(/-/g, '/')).getTime();
  var diff = Math.floor((now - target) / 1000);
  if (diff < 60) return '刚刚';
  if (diff < 3600) return "".concat(Math.floor(diff / 60), "\u5206\u949F\u524D");
  if (diff < 86400) return "".concat(Math.floor(diff / 3600), "\u5C0F\u65F6\u524D");
  return "".concat(Math.floor(diff / 86400), "\u5929\u524D");
}

/** 格式化日期 */
function formatDate(dateStr) {
  if (!dateStr) return '';
  var dt = new Date(dateStr.replace(/-/g, '/'));
  var y = dt.getFullYear();
  var m = String(dt.getMonth() + 1).padStart(2, '0');
  var d = String(dt.getDate()).padStart(2, '0');
  return "".concat(y, "-").concat(m, "-").concat(d);
}

/** 格式化时间 */
function formatTime(dateStr) {
  if (!dateStr) return '';
  var dt = new Date(dateStr.replace(/-/g, '/'));
  var h = String(dt.getHours()).padStart(2, '0');
  var m = String(dt.getMinutes()).padStart(2, '0');
  var s = String(dt.getSeconds()).padStart(2, '0');
  return "".concat(h, ":").concat(m, ":").concat(s);
}

/** 告警类型中文 */
function alertTypeLabel(type) {
  var map = {
    fall: '跌倒检测',
    heart_rate: '心率异常',
    breath_rate: '呼吸异常',
    inactivity: '久未活动',
    offline: '设备离线',
    manual_sos: '手动求救',
    smoke_alarm: '烟雾告警',
    gas_leak: '煤气泄漏',
    door_open_long: '门未关'
  };
  return map[type] || type;
}

/** 告警级别颜色 */
function alertLevelColor(level) {
  var map = {
    info: '#1890ff',
    warning: '#fa8c16',
    critical: '#ff7a45',
    emergency: '#f5222d'
  };
  return map[level] || '#999';
}

/** 告警级别中文 */
function alertLevelLabel(level) {
  var map = {
    info: '提示',
    warning: '一般',
    critical: '重要',
    emergency: '紧急'
  };
  return map[level] || level;
}

/** 体态中文 */
function postureLabel(posture) {
  var map = {
    standing: '站立',
    sitting: '坐姿',
    lying: '平躺',
    walking: '行走'
  };
  return map[posture] || posture || '未知';
}

/** 性别中文 */
function genderLabel(g) {
  if (g === 1) return '男';
  if (g === 2) return '女';
  return '未知';
}

/** 处理状态中文 */
function handleStatusLabel(status) {
  if (status === 0) return '未处理';
  if (status === 1) return '处理中';
  if (status === 2) return '已处理';
  return '';
}

/** 设备类型中文 */
function deviceCategoryLabel(cat) {
  var map = {
    radar_fall: '跌倒雷达',
    radar_bedside: '心率雷达',
    infrared: '红外探测器',
    door_magnet: '门磁',
    camera: '摄像头',
    sos_button: '呼叫按钮',
    smoke_detector: '烟雾报警',
    gas_detector: '煤气报警'
  };
  return map[cat] || cat;
}

/***/ })

}]);
//# sourceMappingURL=common.js.map