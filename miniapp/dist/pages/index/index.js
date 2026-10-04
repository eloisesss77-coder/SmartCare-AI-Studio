"use strict";
(wx["webpackJsonp"] = wx["webpackJsonp"] || []).push([["pages/index/index"],{

/***/ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/index/index!./src/pages/index/index.tsx":
/*!****************************************************************************************************************!*\
  !*** ./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/index/index!./src/pages/index/index.tsx ***!
  \****************************************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ Index; }
/* harmony export */ });
/* harmony import */ var D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/regenerator.js */ "./node_modules/@babel/runtime/helpers/esm/regenerator.js");
/* harmony import */ var D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ "./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js");
/* harmony import */ var D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/slicedToArray.js */ "./node_modules/@babel/runtime/helpers/esm/slicedToArray.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "./node_modules/react/cjs/react.production.min.js");
/* harmony import */ var _tarojs_components__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! @tarojs/components */ "./node_modules/@tarojs/plugin-platform-weapp/dist/components-react.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @tarojs/taro */ "./node_modules/@tarojs/taro/index.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_tarojs_taro__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _services_api__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../services/api */ "./src/services/api.ts");
/* harmony import */ var _components_elderly_card_elderly_card__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../components/elderly-card/elderly-card */ "./src/components/elderly-card/elderly-card.tsx");
/* harmony import */ var _components_alert_banner_alert_banner__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../components/alert-banner/alert-banner */ "./src/components/alert-banner/alert-banner.tsx");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! react/jsx-runtime */ "./node_modules/react/cjs/react-jsx-runtime.production.min.js");











function Index() {
  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)([]),
    _useState2 = (0,D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_6__["default"])(_useState, 2),
    list = _useState2[0],
    setList = _useState2[1];
  var _useState3 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(true),
    _useState4 = (0,D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_6__["default"])(_useState3, 2),
    loading = _useState4[0],
    setLoading = _useState4[1];
  var _useState5 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false),
    _useState6 = (0,D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_6__["default"])(_useState5, 2),
    error = _useState6[0],
    setError = _useState6[1];
  var _useState7 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false),
    _useState8 = (0,D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_6__["default"])(_useState7, 2),
    showAlert = _useState8[0],
    setShowAlert = _useState8[1];
  var _useState9 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)({
      type: '',
      message: '',
      elderlyId: 0
    }),
    _useState0 = (0,D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_6__["default"])(_useState9, 2),
    alertInfo = _useState0[0],
    setAlertInfo = _useState0[1];
  var listRef = (0,react__WEBPACK_IMPORTED_MODULE_0__.useRef)([]);
  var fetchData = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(/*#__PURE__*/(0,D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_7__["default"])(/*#__PURE__*/(0,D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_8__["default"])().m(function _callee() {
    var res, data, fallItem, _t;
    return (0,D_SmartCare_AI_Studio_03_Projects_smartcare_monitor_miniapp_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_8__["default"])().w(function (_context) {
      while (1) switch (_context.p = _context.n) {
        case 0:
          _context.p = 0;
          _context.n = 1;
          return (0,_services_api__WEBPACK_IMPORTED_MODULE_2__.getMyElderly)();
        case 1:
          res = _context.v;
          data = res.data || [];
          setList(data);
          listRef.current = data;
          setError(false);

          // 检查是否有跌倒告警
          fallItem = data.find(function (item) {
            var _item$latestRadarData;
            return ((_item$latestRadarData = item.latestRadarData) === null || _item$latestRadarData === void 0 ? void 0 : _item$latestRadarData.fallStatus) === 1;
          });
          if (fallItem) {
            setAlertInfo({
              type: 'fall',
              message: "".concat(fallItem.elderlyName, "\uFF08").concat(fallItem.roomNo, "\u5BA4\uFF09\u68C0\u6D4B\u5230\u8DCC\u5012\uFF01"),
              elderlyId: fallItem.elderlyId
            });
            setShowAlert(true);
          }
          _context.n = 3;
          break;
        case 2:
          _context.p = 2;
          _t = _context.v;
          // 已绑定过数据时保留旧列表，不清空
          if (listRef.current.length === 0) {
            setError(true);
          }
          _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showToast({
            title: '加载失败',
            icon: 'none'
          });
        case 3:
          _context.p = 3;
          setLoading(false);
          return _context.f(3);
        case 4:
          return _context.a(2);
      }
    }, _callee, null, [[0, 2, 3, 4]]);
  })), []);
  (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(function () {
    fetchData();
  }, [fetchData]);
  (0,_tarojs_taro__WEBPACK_IMPORTED_MODULE_1__.useDidShow)(function () {
    fetchData();
  });
  (0,_tarojs_taro__WEBPACK_IMPORTED_MODULE_1__.usePullDownRefresh)(function () {
    fetchData().then(function () {
      return _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().stopPullDownRefresh();
    });
  });
  var handleCardTap = function handleCardTap(id) {
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().navigateTo({
      url: "/pages/elderly-detail/elderly-detail?id=".concat(id)
    });
  };
  var handleAdd = function handleAdd() {
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().navigateTo({
      url: '/pages/bind/bind'
    });
  };
  var handleCall = function handleCall() {
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().makePhoneCall({
      phoneNumber: '120'
    });
  };
  var handleViewAlert = function handleViewAlert() {
    setShowAlert(false);
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().navigateTo({
      url: "/pages/elderly-detail/elderly-detail?id=".concat(alertInfo.elderlyId)
    });
  };
  if (loading) {
    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
      className: "container",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
        style: {
          textAlign: 'center',
          paddingTop: '200px'
        },
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
          className: "text-muted",
          children: "\u52A0\u8F7D\u4E2D..."
        })
      })
    });
  }
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
    className: "container",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_components_alert_banner_alert_banner__WEBPACK_IMPORTED_MODULE_4__["default"], {
      visible: showAlert,
      alertType: alertInfo.type,
      message: alertInfo.message,
      onCall: handleCall,
      onView: handleViewAlert
    }), error && list.length === 0 ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
      className: "empty-page",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
        className: "empty-icon",
        children: "\uD83D\uDCE1"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
        className: "empty-title",
        children: "\u7F51\u7EDC\u8FDE\u63A5\u5931\u8D25"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
        className: "empty-desc",
        children: "\u8BF7\u68C0\u67E5\u7F51\u7EDC\u540E\u91CD\u8BD5"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
        className: "btn btn-primary btn-block",
        onClick: fetchData,
        children: "\u91CD\u65B0\u52A0\u8F7D"
      })]
    }) : list.length === 0 ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
      className: "empty-page",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
        className: "empty-icon",
        children: "\uD83C\uDFE0"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
        className: "empty-title",
        children: "\u8FD8\u6CA1\u6709\u7ED1\u5B9A\u8001\u4EBA"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
        className: "empty-desc",
        children: "\u7ED1\u5B9A\u540E\u5373\u53EF\u968F\u65F6\u67E5\u770B\u7238\u5988\u7684\u5065\u5EB7\u72B6\u6001"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
        className: "btn btn-primary btn-block",
        onClick: handleAdd,
        children: "\u7ACB\u5373\u7ED1\u5B9A"
      })]
    }) : /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.ScrollView, {
      scrollY: true,
      className: "elderly-list",
      children: [list.map(function (item) {
        return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_components_elderly_card_elderly_card__WEBPACK_IMPORTED_MODULE_3__["default"], {
          item: item,
          onTap: function onTap() {
            return handleCardTap(item.elderlyId);
          }
        }, item.elderlyId);
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.View, {
        className: "add-hint",
        onClick: handleAdd,
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_9__.Text, {
          className: "text-muted",
          children: "+ \u6DFB\u52A0\u8001\u4EBA"
        })
      })]
    })]
  });
}

/***/ }),

/***/ "./src/components/alert-banner/alert-banner.tsx":
/*!******************************************************!*\
  !*** ./src/components/alert-banner/alert-banner.tsx ***!
  \******************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ AlertBanner; }
/* harmony export */ });
/* harmony import */ var _tarojs_components__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @tarojs/components */ "./node_modules/@tarojs/plugin-platform-weapp/dist/components-react.js");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-runtime */ "./node_modules/react/cjs/react-jsx-runtime.production.min.js");



function AlertBanner(_ref) {
  var visible = _ref.visible,
    alertType = _ref.alertType,
    message = _ref.message,
    onCall = _ref.onCall,
    onView = _ref.onView;
  if (!visible) return null;
  var typeLabels = {
    fall: '跌倒告警',
    manual_sos: '紧急求救',
    gas_leak: '煤气泄漏',
    smoke_alarm: '火警'
  };
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.View, {
    className: "ab-overlay",
    children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.View, {
      className: "ab-modal",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.Text, {
        className: "ab-icon",
        children: "\uD83C\uDD98"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.Text, {
        className: "ab-title",
        children: typeLabels[alertType] || '紧急告警'
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.Text, {
        className: "ab-message",
        children: message
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.View, {
        className: "ab-actions",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.View, {
          className: "ab-btn ab-btn-call",
          onClick: onCall,
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.Text, {
            children: "\uD83D\uDCDE \u7ACB\u5373\u547C\u53EB"
          })
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.View, {
          className: "ab-btn ab-btn-view",
          onClick: onView,
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.Text, {
            children: "\u67E5\u770B\u8BE6\u60C5"
          })
        })]
      })]
    })
  });
}

/***/ }),

/***/ "./src/components/elderly-card/elderly-card.tsx":
/*!******************************************************!*\
  !*** ./src/components/elderly-card/elderly-card.tsx ***!
  \******************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ ElderlyCard; }
/* harmony export */ });
/* harmony import */ var _tarojs_components__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @tarojs/components */ "./node_modules/@tarojs/plugin-platform-weapp/dist/components-react.js");
/* harmony import */ var _utils_format__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../utils/format */ "./src/utils/format.ts");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-runtime */ "./node_modules/react/cjs/react-jsx-runtime.production.min.js");




function ElderlyCard(_ref) {
  var item = _ref.item,
    onTap = _ref.onTap;
  var elderlyName = item.elderlyName,
    roomNo = item.roomNo,
    relation = item.relation,
    latestRadarData = item.latestRadarData,
    unreadAlerts = item.unreadAlerts,
    devices = item.devices,
    status = item.status;
  var hasFall = (latestRadarData === null || latestRadarData === void 0 ? void 0 : latestRadarData.fallStatus) === 1;
  var isOffline = !latestRadarData;
  var hasWarning = unreadAlerts > 0 && !hasFall;
  var dotClass = 'status-dot status-dot-green';
  if (hasFall) dotClass = 'status-dot status-dot-red';else if (isOffline) dotClass = 'status-dot status-dot-gray';else if (hasWarning) dotClass = 'status-dot status-dot-yellow';
  var hr = latestRadarData === null || latestRadarData === void 0 ? void 0 : latestRadarData.heartRate;
  var br = latestRadarData === null || latestRadarData === void 0 ? void 0 : latestRadarData.breathRate;
  var inBed = latestRadarData === null || latestRadarData === void 0 ? void 0 : latestRadarData.inBed;
  var posture = latestRadarData !== null && latestRadarData !== void 0 && latestRadarData.bodyPosture ? (0,_utils_format__WEBPACK_IMPORTED_MODULE_1__.postureLabel)(latestRadarData.bodyPosture) : '';
  var time = latestRadarData !== null && latestRadarData !== void 0 && latestRadarData.timestamp ? (0,_utils_format__WEBPACK_IMPORTED_MODULE_1__.formatRelativeTime)(latestRadarData.timestamp) : '暂无数据';
  var onlineDevices = devices.filter(function (d) {
    return d.onlineStatus === 1;
  }).length;
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.View, {
    className: "elderly-card",
    onClick: onTap,
    children: [hasFall && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.View, {
      className: "fall-overlay",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.Text, {
        className: "fall-icon",
        children: "\uD83C\uDD98"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.Text, {
        className: "fall-text",
        children: "\u8DCC\u5012\u544A\u8B66\uFF01"
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.View, {
      className: "ec-header",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.View, {
        className: "flex-row",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.View, {
          className: dotClass
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.Text, {
          className: "ec-name",
          children: elderlyName
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.Text, {
        className: "ec-room",
        children: [roomNo, "\u5BA4"]
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.View, {
      className: "ec-body",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.View, {
        className: "ec-vital",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.View, {
          className: "ec-vital-item",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.Text, {
            className: "ec-vital-label",
            children: "\u5FC3\u7387"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.Text, {
            className: "ec-vital-value ".concat(hr && (hr < 40 || hr > 120) ? 'text-danger' : hr && (hr < 60 || hr > 90) ? 'text-warning' : ''),
            children: hr !== null && hr !== void 0 ? hr : '--'
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.Text, {
            className: "ec-vital-unit",
            children: "BPM"
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.View, {
          className: "ec-divider"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.View, {
          className: "ec-vital-item",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.Text, {
            className: "ec-vital-label",
            children: "\u547C\u5438"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.Text, {
            className: "ec-vital-value ".concat(br && (br < 8 || br > 30) ? 'text-danger' : ''),
            children: br !== null && br !== void 0 ? br : '--'
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.Text, {
            className: "ec-vital-unit",
            children: "\u6B21/\u5206"
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.View, {
          className: "ec-divider"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.View, {
          className: "ec-vital-item",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.Text, {
            className: "ec-vital-label",
            children: "\u72B6\u6001"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.Text, {
            className: "ec-vital-value ec-posture",
            children: inBed === 1 ? '在床' : inBed === 0 ? '离床' : '--'
          }), posture && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.Text, {
            className: "ec-vital-unit",
            children: posture
          })]
        })]
      })
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.View, {
      className: "ec-footer",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.Text, {
        className: "text-muted",
        children: [relation, " \xB7 ", time]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.View, {
        className: "flex-row",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.Text, {
          className: "ec-device-count",
          children: [onlineDevices, "/", devices.length, "\u8BBE\u5907\u5728\u7EBF"]
        }), unreadAlerts > 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.Text, {
          className: "ec-badge",
          children: unreadAlerts > 99 ? '99+' : unreadAlerts
        })]
      })]
    })]
  });
}

/***/ }),

/***/ "./src/pages/index/index.tsx":
/*!***********************************!*\
  !*** ./src/pages/index/index.tsx ***!
  \***********************************/
/***/ (function(__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) {

/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @tarojs/runtime */ "./node_modules/@tarojs/runtime/dist/runtime.esm.js");
/* harmony import */ var _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_index_index_index_tsx__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! !!../../../node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/index/index!./index.tsx */ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/index/index!./src/pages/index/index.tsx");


var config = {"navigationBarTitleText":"安伴 Guardian","enablePullDownRefresh":true,"backgroundTextStyle":"dark"};


var inst = Page((0,_tarojs_runtime__WEBPACK_IMPORTED_MODULE_1__.createPageConfig)(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_index_index_index_tsx__WEBPACK_IMPORTED_MODULE_0__["default"], 'pages/index/index', {root:{cn:[]}}, config || {}))


/* unused harmony default export */ var __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_index_index_index_tsx__WEBPACK_IMPORTED_MODULE_0__["default"]);


/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ var __webpack_exec__ = function(moduleId) { return __webpack_require__(__webpack_require__.s = moduleId); }
/******/ __webpack_require__.O(0, ["taro","vendors","common"], function() { return __webpack_exec__("./src/pages/index/index.tsx"); });
/******/ var __webpack_exports__ = __webpack_require__.O();
/******/ }
]);
//# sourceMappingURL=index.js.map