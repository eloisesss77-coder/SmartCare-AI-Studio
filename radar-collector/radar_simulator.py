"""毫米波雷达模拟器

模拟真实雷达设备行为，生成具有时间节律的雷达感知数据。
"""

import logging
import math
import random
import time
from datetime import datetime
from typing import Any

logger = logging.getLogger(__name__)


class RadarSimulator:
    """毫米波雷达模拟器，根据一天中不同时段模拟老人行为模式。"""

    # 时段与行为模式映射
    TIME_BEHAVIOR_MAP = {
        (6, 8): {
            "posture": "walking",
            "activity_base": 60,
            "activity_range": 20,
            "in_bed_prob": 0.05,
            "heart_base": 80,
            "breath_base": 18,
        },
        (8, 12): {
            "posture": "standing",
            "activity_base": 50,
            "activity_range": 30,
            "in_bed_prob": 0.1,
            "heart_base": 78,
            "breath_base": 17,
        },
        (12, 14): {
            "posture": "lying",
            "activity_base": 10,
            "activity_range": 10,
            "in_bed_prob": 0.85,
            "heart_base": 65,
            "breath_base": 14,
        },
        (14, 18): {
            "posture": "standing",
            "activity_base": 55,
            "activity_range": 25,
            "in_bed_prob": 0.08,
            "heart_base": 77,
            "breath_base": 17,
        },
        (18, 21): {
            "posture": "sitting",
            "activity_base": 30,
            "activity_range": 20,
            "in_bed_prob": 0.1,
            "heart_base": 72,
            "breath_base": 16,
        },
        (21, 24): {
            "posture": "lying",
            "activity_base": 5,
            "activity_range": 8,
            "in_bed_prob": 0.92,
            "heart_base": 62,
            "breath_base": 13,
        },
        (0, 6): {
            "posture": "lying",
            "activity_base": 3,
            "activity_range": 5,
            "in_bed_prob": 0.95,
            "heart_base": 60,
            "breath_base": 12,
        },
    }

    POSTURE_OPTIONS = ["standing", "sitting", "lying", "walking"]

    def __init__(self, elderly_list: list[dict], fall_probability: float = 0.02) -> None:
        """初始化雷达模拟器。

        Args:
            elderly_list: 老人信息列表，每项包含 id, name, room, device_sn
            fall_probability: 每次采样发生跌倒的概率（0~1）
        """
        self._elderly_list = elderly_list
        self._fall_probability = fall_probability
        logger.info(
            "RadarSimulator 初始化完成，老人数量: %d, 跌倒概率: %.2f%%",
            len(elderly_list),
            fall_probability * 100,
        )

    def _get_behavior_params(self) -> dict:
        """根据当前时间获取对应的行为参数。

        Returns:
            包含当前时段行为参数的字典
        """
        now = datetime.now()
        current_hour = now.hour

        for (start, end), params in self.TIME_BEHAVIOR_MAP.items():
            if start <= current_hour < end:
                return params

        # fallback: 默认夜间模式
        return self.TIME_BEHAVIOR_MAP[(0, 6)]

    def _clamp(self, value: float, minimum: float, maximum: float) -> float:
        """将值限制在指定范围内。"""
        return max(minimum, min(maximum, value))

    def generate_data(self, elder_id: str, room_no: str) -> dict[str, Any]:
        """为指定老人生成模拟雷达数据。

        Args:
            elder_id: 老人ID
            room_no: 房间号

        Returns:
            包含设备信息、时间戳和雷达数据的字典

        Raises:
            ValueError: 老人ID在配置列表中找不到时
        """
        elder_info = None
        for e in self._elderly_list:
            if e["id"] == elder_id:
                elder_info = e
                break

        if elder_info is None:
            raise ValueError(f"未找到老人ID: {elder_id}")

        behavior = self._get_behavior_params()

        # 跌倒状态：2% 概率
        fall_status = 1 if random.random() < self._fall_probability else 0

        # 心率：以 base 为中心，正态分布模拟，波动范围 ±10
        heart_rate = int(self._clamp(
            random.gauss(behavior["heart_base"], 5), 50, 110
        ))

        # 呼吸率
        breath_rate = int(self._clamp(
            random.gauss(behavior["breath_base"], 3), 10, 30
        ))

        # 活动量
        activity_level = int(self._clamp(
            random.gauss(behavior["activity_base"], behavior["activity_range"] / 3),
            0, 100,
        ))

        # 在床状态
        in_bed = 1 if random.random() < behavior["in_bed_prob"] else 0

        # 体态
        if fall_status:
            body_posture = "lying"
        elif in_bed:
            body_posture = "lying"
        else:
            body_posture = behavior["posture"]

        # 距离（米）
        distance = round(random.uniform(0.5, 5.0), 1)

        # 角度（度）
        angle = round(random.uniform(-45, 45), 1)

        # 构造数据
        now_ts = int(time.time())
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        return {
            "device_sn": elder_info["device_sn"],
            "elder_id": elder_id,
            "elder_name": elder_info.get("name", ""),
            "room_no": room_no,
            "timestamp": now_ts,
            "datetime": now_str,
            "data": {
                "fall_status": fall_status,
                "heart_rate": heart_rate,
                "breath_rate": breath_rate,
                "activity_level": activity_level,
                "in_bed": in_bed,
                "body_posture": body_posture,
                "distance": distance,
                "angle": angle,
            },
        }
