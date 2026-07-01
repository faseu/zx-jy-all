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
 * 楼层表单对象
 *
 * @author youlaitech
 * @since 2026-01-20 20:15
 */
@Getter
@Setter
@Schema(description = "楼层表单对象")
public class TFloorForm implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Schema(description = "主键")
    private Long id;

    @Schema(description = "楼层名称")
    @Size(max=100, message="楼层名称长度不能超过100个字符")
    private String floorName;

    @Schema(description = "楼层编号数")
    private Integer floorNo;

    @Schema(description = "所属楼栋ID")
    private Long buildingId;

    @Schema(description = "所属楼栋名称")
    @Size(max=100, message="所属楼栋名称长度不能超过100个字符")
    private String buildingName;

    @Schema(description = "设备数量")
    private Integer deviceNumber;

    @Schema(description = "楼层平面图纸（PDF DWG CAD 5MB以内）")
//    @Size(max=50, message="楼层平面图纸（PDF DWG CAD 5MB以内）长度不能超过50个字符")
    private String floorDrawing;

//    @Schema(description = "创建人ID")
//    private Long createBy;
//
//    @Schema(description = "创建时间")
//    @JsonFormat(timezone = "GMT+8", pattern = "yyyy-MM-dd HH:mm:ss")
//    private LocalDateTime createTime;
//
//    @Schema(description = "修改人ID")
//    private Long updateBy;
//
//    @Schema(description = "更新时间")
//    @JsonFormat(timezone = "GMT+8", pattern = "yyyy-MM-dd HH:mm:ss")
//    private LocalDateTime updateTime;
//
//    @Schema(description = "逻辑删除标识(1-已删除 0-未删除)")
//    private Integer isDeleted;


}
