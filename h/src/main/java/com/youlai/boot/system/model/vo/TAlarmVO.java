package com.youlai.boot.system.model.vo;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

/**
 * 告警视图对象
 *
 * @author youlaitech
 * @since 2026-01-20 20:18
 */
@Getter
@Setter
@Schema( description = "告警视图对象")
public class TAlarmVO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Schema(description = "主键")
    private Long id;
    @Schema(description = "告警设备全网编号")
    private String entireNo;
    @Schema(description = "设备ID")
    private Long deviceId;
    @Schema(description = "设备名称")
    private String deviceName;
    @Schema(description = "所属监狱ID")
    private Long prisonId;
    @Schema(description = "所属监狱名称")
    private String prisonName;
    @Schema(description = "所属楼栋ID")
    private Long buildingId;
    @Schema(description = "所属楼栋名称")
    private String buildingName;
    @Schema(description = "所属楼层ID")
    private Long floorId;
    @Schema(description = "所属楼层名称")
    private String floorName;
    @Schema(description = "告警内容")
    private String content;
    @Schema(description = "告警类型")
    private String type;
    @Schema(description = "告警时间")
    private LocalDateTime alarmTime;
    @Schema(description = "建议措施")
    private String suggestions;
    @Schema(description = "处理状态（0：未处理，1：已处理）")
    private Integer processingStatus;
    @Schema(description = "解决时间")
    private LocalDateTime resolutionTime;
    @Schema(description = "是否屏蔽（0：否，1：是）")
    private Integer blocked;
    @Schema(description = "创建人ID")
    private Long createBy;
    @Schema(description = "创建时间")
    private LocalDateTime createTime;
    @Schema(description = "修改人ID")
    private Long updateBy;
    @Schema(description = "更新时间")
    private LocalDateTime updateTime;
    @Schema(description = "逻辑删除标识(1-已删除 0-未删除)")
    private Integer isDeleted;
}
