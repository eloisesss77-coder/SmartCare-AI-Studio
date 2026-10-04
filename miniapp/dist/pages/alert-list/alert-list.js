"use strict";
(wx["webpackJsonp"] = wx["webpackJsonp"] || []).push([["pages/alert-list/alert-list"],{

/***/ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/alert-list/alert-list!./src/pages/alert-list/alert-list.tsx":
/*!************************************************************************************************************************************!*\
  !*** ./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/alert-list/alert-list!./src/pages/alert-list/alert-list.tsx ***!
  \************************************************************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ AlertList; }
/* harmony export */ });
/* harmony import */ var D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/regenerator.js */ "./node_modules/@babel/runtime/helpers/esm/regenerator.js");
/* harmony import */ var D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ "./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js");
/* harmony import */ var D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/slicedToArray.js */ "./node_modules/@babel/runtime/helpers/esm/slicedToArray.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "./node_modules/react/cjs/react.production.min.js");
/* harmony import */ var _tarojs_components__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @tarojs/components */ "./node_modules/@tarojs/plugin-platform-weapp/dist/components-react.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @tarojs/taro */ "./node_modules/@tarojs/taro/index.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_tarojs_taro__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _services_api__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../services/api */ "./src/services/api.ts");
/* harmony import */ var _utils_format__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../../utils/format */ "./src/utils/format.ts");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! react/jsx-runtime */ "./node_modules/react/cjs/react-jsx-runtime.production.min.js");










function AlertList() {
  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)([]),
    _useState2 = (0,D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_4__["default"])(_useState, 2),
    list = _useState2[0],
    setList = _useState2[1];
  var _useState3 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(true),
    _useState4 = (0,D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_4__["default"])(_useState3, 2),
    loading = _useState4[0],
    setLoading = _useState4[1];
  var _useState5 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(''),
    _useState6 = (0,D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_4__["default"])(_useState5, 2),
    levelFilter = _useState6[0],
    setLevelFilter = _useState6[1];
  var _useState7 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(0),
    _useState8 = (0,D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_4__["default"])(_useState7, 2),
    total = _useState8[0],
    setTotal = _useState8[1];
  var fetchList = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(/*#__PURE__*/(0,D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_5__["default"])(/*#__PURE__*/(0,D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_6__["default"])().m(function _callee() {
    var _res$data, _res$data2, params, res, _t;
    return (0,D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_6__["default"])().w(function (_context) {
      while (1) switch (_context.p = _context.n) {
        case 0:
          setLoading(true);
          _context.p = 1;
          params = {
            page: 1,
            pageSize: 50
          };
          if (levelFilter) params.alertLevel = levelFilter;
          _context.n = 2;
          return (0,_services_api__WEBPACK_IMPORTED_MODULE_2__.getAlertList)(params);
        case 2:
          res = _context.v;
          setList(((_res$data = res.data) === null || _res$data === void 0 ? void 0 : _res$data.list) || []);
          setTotal(((_res$data2 = res.data) === null || _res$data2 === void 0 ? void 0 : _res$data2.total) || 0);
          _context.n = 4;
          break;
        case 3:
          _context.p = 3;
          _t = _context.v;
          _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showToast({
            title: '加载失败',
            icon: 'none'
          });
        case 4:
          _context.p = 4;
          setLoading(false);
          return _context.f(4);
        case 5:
          return _context.a(2);
      }
    }, _callee, null, [[1, 3, 4, 5]]);
  })), [levelFilter]);
  (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(function () {
    fetchList();
  }, [fetchList]);
  (0,_tarojs_taro__WEBPACK_IMPORTED_MODULE_1__.usePullDownRefresh)(function () {
    fetchList().then(function () {
      return _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().stopPullDownRefresh();
    });
  });
  var levelOptions = [{
    value: '',
    label: '全部'
  }, {
    value: 'emergency',
    label: '紧急'
  }, {
    value: 'critical',
    label: '重要'
  }, {
    value: 'warning',
    label: '一般'
  }];
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_7__.View, {
    className: "alert-page",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_7__.View, {
      className: "filter-bar",
      children: levelOptions.map(function (opt) {
        return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_7__.View, {
          className: "filter-chip ".concat(levelFilter === opt.value ? 'filter-chip-active' : ''),
          onClick: function onClick() {
            return setLevelFilter(opt.value);
          },
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_7__.Text, {
            children: opt.label
          })
        }, opt.value);
      })
    }), loading ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_7__.View, {
      style: {
        textAlign: 'center',
        paddingTop: '120px'
      },
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_7__.Text, {
        className: "text-muted",
        children: "\u52A0\u8F7D\u4E2D..."
      })
    }) : list.length === 0 ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_7__.View, {
      style: {
        textAlign: 'center',
        paddingTop: '120px'
      },
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_7__.Text, {
        className: "text-muted",
        children: "\u6682\u65E0\u544A\u8B66"
      })
    }) : /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_7__.ScrollView, {
      scrollY: true,
      className: "alert-list",
      children: list.map(function (item) {
        return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_7__.View, {
          className: "alert-item",
          onClick: function onClick() {
            return _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().navigateTo({
              url: "/pages/alert-detail/alert-detail?id=".concat(item.id)
            });
          },
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_7__.View, {
            className: "flex-between",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_7__.View, {
              className: "flex-row",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_7__.View, {
                className: "alert-dot",
                style: {
                  backgroundColor: (0,_utils_format__WEBPACK_IMPORTED_MODULE_8__.alertLevelColor)(item.alertLevel)
                }
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_7__.View, {
                children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_7__.Text, {
                  className: "alert-type",
                  children: (0,_utils_format__WEBPACK_IMPORTED_MODULE_8__.alertTypeLabel)(item.alertType)
                }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_7__.View, {
                  className: "flex-row mt-8",
                  children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_7__.Text, {
                    className: "text-muted",
                    children: [item.elderlyName, " \xB7 ", item.roomNo, "\u5BA4"]
                  }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_7__.Text, {
                    className: "alert-level",
                    style: {
                      color: (0,_utils_format__WEBPACK_IMPORTED_MODULE_8__.alertLevelColor)(item.alertLevel)
                    },
                    children: (0,_utils_format__WEBPACK_IMPORTED_MODULE_8__.alertLevelLabel)(item.alertLevel)
                  })]
                })]
              })]
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_7__.View, {
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_7__.Text, {
                className: "text-muted",
                children: (0,_utils_format__WEBPACK_IMPORTED_MODULE_8__.formatRelativeTime)(item.createdAt)
              }), item.handledStatus === 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_7__.Text, {
                className: "tag tag-red",
                children: "\u672A\u5904\u7406"
              }), item.handledStatus === 2 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_7__.Text, {
                className: "tag tag-green",
                children: "\u5DF2\u5904\u7406"
              })]
            })]
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_7__.Text, {
            className: "alert-msg mt-8",
            children: item.alertMessage
          })]
        }, item.id);
      })
    })]
  });
}

/***/ }),

/***/ "./src/pages/alert-list/alert-list.tsx":
/*!*********************************************!*\
  !*** ./src/pages/alert-list/alert-list.tsx ***!
  \*********************************************/
/***/ (function(__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) {

/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @tarojs/runtime */ "./node_modules/@tarojs/runtime/dist/runtime.esm.js");
/* harmony import */ var _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_alert_list_alert_list_alert_list_tsx__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! !!../../../node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/alert-list/alert-list!./alert-list.tsx */ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/alert-list/alert-list!./src/pages/alert-list/alert-list.tsx");


var config = {"navigationBarTitleText":"告警中心","enablePullDownRefresh":true};


var inst = Page((0,_tarojs_runtime__WEBPACK_IMPORTED_MODULE_1__.createPageConfig)(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_alert_list_alert_list_alert_list_tsx__WEBPACK_IMPORTED_MODULE_0__["default"], 'pages/alert-list/alert-list', {root:{cn:[]}}, config || {}))


/* unused harmony default export */ var __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_alert_list_alert_list_alert_list_tsx__WEBPACK_IMPORTED_MODULE_0__["default"]);


/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ var __webpack_exec__ = function(moduleId) { return __webpack_require__(__webpack_require__.s = moduleId); }
/******/ __webpack_require__.O(0, ["taro","vendors","common"], function() { return __webpack_exec__("./src/pages/alert-list/alert-list.tsx"); });
/******/ var __webpack_exports__ = __webpack_require__.O();
/******/ }
]);
//# sourceMappingURL=alert-list.js.map