package com.youlai.boot.system.model.entity;

import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;
import com.baomidou.mybatisplus.annotation.TableName;
import com.youlai.boot.common.base.BaseEntity;

/**
 * 告警实体对象
 *
 * @author youlaitech
 * @since 2026-01-20 20:18
 */
@Getter
@Setter
@TableName("t_alarm")
public class TAlarm extends BaseEntity {

    private static final long serialVersionUID = 1L;

    /**
     * 告警设备全网编号
     */
    private String entireNo;
    /**
     * 设备ID
     */
    private Long deviceId;
    /**
     * 设备名称
     */
    private String deviceName;
    /**
     * 所属监狱ID
     */
    private Long prisonId;
    /**
     * 所属监狱名称
     */
    private String prisonName;

    /**
     * 楼层名称
     */
    private String floorName;
    /**
     * 楼层id
     */
    private Long floorId;
    /**
     * 所属楼栋ID
     */
    private Long buildingId;
    /**
     * 所属楼栋名称
     */
    private String buildingName;

    /**
     * 告警内容
     */
    private String content;
    /**
     * 告警类型
     */
    private String type;
    /**
     * 告警时间
     */
    private LocalDateTime alarmTime;
    /**
     * 建议措施
     */
    private String suggestions;
    /**
     * 处理状态（0：未处理，1：已处理）
     */
    private Integer processingStatus;
    /**
     * 解决时间
     */
    private LocalDateTime resolutionTime;
    /**
     * 是否屏蔽（0：否，1：是）
     */
    private Integer blocked;
    /**
     * 创建人ID
     */
    private Long createBy;
    /**
     * 修改人ID
     */
    private Long updateBy;
    /**
     * 逻辑删除标识(1-已删除 0-未删除)
     */
    private Integer isDeleted;
}
