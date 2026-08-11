"use strict";
(wx["webpackJsonp"] = wx["webpackJsonp"] || []).push([["pages/bind/bind"],{

/***/ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/bind/bind!./src/pages/bind/bind.tsx":
/*!************************************************************************************************************!*\
  !*** ./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/bind/bind!./src/pages/bind/bind.tsx ***!
  \************************************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ Bind; }
/* harmony export */ });
/* harmony import */ var D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/regenerator.js */ "./node_modules/@babel/runtime/helpers/esm/regenerator.js");
/* harmony import */ var D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ "./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js");
/* harmony import */ var D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/slicedToArray.js */ "./node_modules/@babel/runtime/helpers/esm/slicedToArray.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "./node_modules/react/cjs/react.production.min.js");
/* harmony import */ var _tarojs_components__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @tarojs/components */ "./node_modules/@tarojs/plugin-platform-weapp/dist/components-react.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @tarojs/taro */ "./node_modules/@tarojs/taro/index.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_tarojs_taro__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _services_api__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../services/api */ "./src/services/api.ts");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! react/jsx-runtime */ "./node_modules/react/cjs/react-jsx-runtime.production.min.js");









function Bind() {
  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(''),
    _useState2 = (0,D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_4__["default"])(_useState, 2),
    code = _useState2[0],
    setCode = _useState2[1];
  var _useState3 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)('子女'),
    _useState4 = (0,D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_4__["default"])(_useState3, 2),
    relation = _useState4[0],
    setRelation = _useState4[1];
  var _useState5 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false),
    _useState6 = (0,D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_4__["default"])(_useState5, 2),
    loading = _useState6[0],
    setLoading = _useState6[1];
  var _useState7 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false),
    _useState8 = (0,D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_4__["default"])(_useState7, 2),
    isLoggedIn = _useState8[0],
    setIsLoggedIn = _useState8[1];
  var relations = ['子女', '配偶', '亲属', '其他'];

  // 等待登录完成
  (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(function () {
    var retries = 0;
    var check = setInterval(function () {
      var fid = _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().getStorageSync('familyId');
      if (fid) {
        setIsLoggedIn(true);
        clearInterval(check);
      }
      retries++;
      if (retries > 30) clearInterval(check); // 15秒超时
    }, 500);
    return function () {
      return clearInterval(check);
    };
  }, []);
  var handleBind = /*#__PURE__*/function () {
    var _ref = (0,D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])(/*#__PURE__*/(0,D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_6__["default"])().m(function _callee() {
      var familyId, _res$data, _res$data2, res, _err$data, msg, _t;
      return (0,D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_6__["default"])().w(function (_context) {
        while (1) switch (_context.p = _context.n) {
          case 0:
            if (!(!code || code.length < 4)) {
              _context.n = 1;
              break;
            }
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showToast({
              title: '请输入正确的绑定码',
              icon: 'none'
            });
            return _context.a(2);
          case 1:
            familyId = _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().getStorageSync('familyId');
            if (familyId) {
              _context.n = 2;
              break;
            }
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showToast({
              title: '登录未完成，请稍后重试',
              icon: 'none'
            });
            return _context.a(2);
          case 2:
            setLoading(true);
            _context.p = 3;
            _context.n = 4;
            return (0,_services_api__WEBPACK_IMPORTED_MODULE_2__.useBindCode)(code, relation);
          case 4:
            res = _context.v;
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showModal({
              title: '绑定成功',
              content: "\u5DF2\u6210\u529F\u7ED1\u5B9A ".concat(((_res$data = res.data) === null || _res$data === void 0 ? void 0 : _res$data.elderlyName) || '', "\uFF08").concat(((_res$data2 = res.data) === null || _res$data2 === void 0 ? void 0 : _res$data2.roomNo) || '', "\u5BA4\uFF09"),
              showCancel: false,
              success: function success() {
                return _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().switchTab({
                  url: '/pages/index/index'
                });
              }
            });
            _context.n = 6;
            break;
          case 5:
            _context.p = 5;
            _t = _context.v;
            msg = (_t === null || _t === void 0 ? void 0 : _t.message) || (_t === null || _t === void 0 || (_err$data = _t.data) === null || _err$data === void 0 ? void 0 : _err$data.message) || '绑定失败';
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showToast({
              title: msg,
              icon: 'none',
              duration: 3000
            });
          case 6:
            _context.p = 6;
            setLoading(false);
            return _context.f(6);
          case 7:
            return _context.a(2);
        }
      }, _callee, null, [[3, 5, 6, 7]]);
    }));
    return function handleBind() {
      return _ref.apply(this, arguments);
    };
  }();
  var handleScan = function handleScan() {
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().scanCode({
      success: function success(res) {
        if (res.result) {
          // 扫码结果可能是 URL?code=XXXXX 或纯绑定码
          var match = res.result.match(/[A-Z0-9]{4,8}$/i);
          setCode(match ? match[0] : res.result);
        }
      },
      fail: function fail() {
        return _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showToast({
          title: '扫码失败',
          icon: 'none'
        });
      }
    });
  };
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_7__.View, {
    className: "bind-page",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_7__.View, {
      className: "card",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_7__.Text, {
        className: "bind-title",
        children: "\u7ED1\u5B9A\u8001\u4EBA"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_7__.Text, {
        className: "bind-desc",
        children: "\u8F93\u5165\u7BA1\u7406\u7AEF\u63D0\u4F9B\u76846\u4F4D\u7ED1\u5B9A\u7801\uFF0C\u6216\u626B\u63CF\u4E8C\u7EF4\u7801\u81EA\u52A8\u7ED1\u5B9A"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_7__.View, {
        className: "bind-input-group",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_7__.Text, {
          className: "bind-label",
          children: "\u7ED1\u5B9A\u7801"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_7__.View, {
          className: "bind-input-row",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_7__.Input, {
            className: "bind-input",
            type: "text",
            maxlength: 10,
            value: code,
            onInput: function onInput(e) {
              return setCode(e.detail.value);
            },
            placeholder: "\u8BF7\u8F93\u5165\u7ED1\u5B9A\u7801"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_7__.View, {
            className: "btn btn-outline",
            onClick: handleScan,
            children: "\u626B\u7801"
          })]
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_7__.View, {
        className: "bind-input-group",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_7__.Text, {
          className: "bind-label",
          children: "\u6211\u7684\u8EAB\u4EFD"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_7__.View, {
          className: "relation-list",
          children: relations.map(function (r) {
            return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_7__.View, {
              className: "relation-chip ".concat(relation === r ? 'relation-chip-active' : ''),
              onClick: function onClick() {
                return setRelation(r);
              },
              children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_7__.Text, {
                children: r
              })
            }, r);
          })
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_7__.View, {
        className: "btn btn-primary btn-block mt-24 ".concat(loading ? 'btn-loading' : ''),
        onClick: handleBind,
        children: loading ? '绑定中...' : '确认绑定'
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_7__.View, {
      className: "bind-tips",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_7__.Text, {
        className: "text-muted",
        children: "\u7ED1\u5B9A\u7801\u8BF7\u8054\u7CFB\u517B\u8001\u673A\u6784\u7BA1\u7406\u5458\u83B7\u53D6"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_7__.Text, {
        className: "text-muted mt-8",
        children: "\u7ED1\u5B9A\u7801\u6709\u6548\u671F\u4E3A24\u5C0F\u65F6"
      })]
    })]
  });
}

/***/ }),

/***/ "./src/pages/bind/bind.tsx":
/*!*********************************!*\
  !*** ./src/pages/bind/bind.tsx ***!
  \*********************************/
/***/ (function(__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) {

/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @tarojs/runtime */ "./node_modules/@tarojs/runtime/dist/runtime.esm.js");
/* harmony import */ var _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_bind_bind_bind_tsx__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! !!../../../node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/bind/bind!./bind.tsx */ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/bind/bind!./src/pages/bind/bind.tsx");


var config = {"navigationBarTitleText":"绑定老人"};


var inst = Page((0,_tarojs_runtime__WEBPACK_IMPORTED_MODULE_1__.createPageConfig)(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_bind_bind_bind_tsx__WEBPACK_IMPORTED_MODULE_0__["default"], 'pages/bind/bind', {root:{cn:[]}}, config || {}))


/* unused harmony default export */ var __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_bind_bind_bind_tsx__WEBPACK_IMPORTED_MODULE_0__["default"]);


/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ var __webpack_exec__ = function(moduleId) { return __webpack_require__(__webpack_require__.s = moduleId); }
/******/ __webpack_require__.O(0, ["taro","vendors","common"], function() { return __webpack_exec__("./src/pages/bind/bind.tsx"); });
/******/ var __webpack_exports__ = __webpack_require__.O();
/******/ }
]);
//# sourceMappingURL=bind.js.map