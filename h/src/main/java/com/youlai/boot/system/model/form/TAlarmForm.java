package com.youlai.boot.system.model.form;

import java.io.Serial;
import java.io.Serializable;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.*;

/**
 * 告警表单对象
 *
 * @author youlaitech
 * @since 2026-01-20 20:18
 */
@Getter
@Setter
@Schema(description = "告警表单对象")
public class TAlarmForm implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Schema(description = "主键")
    private Long id;

    @Schema(description = "告警设备全网编号")
    @NotBlank(message = "告警设备全网编号不能为空")
    @Size(max=100, message="告警设备全网编号长度不能超过100个字符")
    private String entireNo;

    @Schema(description = "设备ID")
    @NotNull(message = "设备ID不能为空")
    private Long deviceId;

    @Schema(description = "设备名称")
    @NotBlank(message = "设备名称不能为空")
    @Size(max=100, message="设备名称长度不能超过100个字符")
    private String deviceName;

    @Schema(description = "所属监狱ID")
    private Long prisonId;

    @Schema(description = "所属监狱名称")
    @Size(max=100, message="所属监狱名称长度不能超过100个字符")
    private String prisonName;

    @Schema(description = "所属楼栋ID")
    private Long buildingId;

    @Schema(description = "所属楼名称")
    @Size(max=100, message="所属楼名称长度不能超过100个字符")
    private String buildingName;

    @Schema(description = "所属楼层ID")
    private Long floorId;

    @Schema(description = "所属楼层名称")
    @Size(max=100, message="所属楼名称长度不能超过100个字符")
    private String floorName;

    @Schema(description = "告警内容")
    @Size(max=65535, message="告警内容长度不能超过65535个字符")
    private String content;

    @Schema(description = "告警类型")
    @Size(max=100, message="告警类型长度不能超过100个字符")
    private String type;

    @Schema(description = "告警时间")
    @JsonFormat(timezone = "GMT+8", pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime alarmTime;

    @Schema(description = "建议措施")
    @Size(max=65535, message="建议措施长度不能超过65535个字符")
    private String suggestions;

    @Schema(description = "处理状态（0：未处理，1：已处理）")
    private Integer processingStatus;

    @Schema(description = "解决时间")
    @JsonFormat(timezone = "GMT+8", pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime resolutionTime;

    @Schema(description = "是否屏蔽（0：否，1：是）")
    private Integer blocked;

    @Schema(description = "创建人ID")
    private Long createBy;

    @Schema(description = "创建时间")
    @JsonFormat(timezone = "GMT+8", pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createTime;

    @Schema(description = "修改人ID")
    private Long updateBy;

    @Schema(description = "更新时间")
    @JsonFormat(timezone = "GMT+8", pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updateTime;

    @Schema(description = "逻辑删除标识(1-已删除 0-未删除)")
    private Integer isDeleted;


}
