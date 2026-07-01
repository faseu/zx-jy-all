package com.youlai.boot.system.model.entity;

import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;
import com.baomidou.mybatisplus.annotation.TableName;
import com.youlai.boot.common.base.BaseEntity;

/**
 * 楼层实体对象
 *
 * @author youlaitech
 * @since 2026-01-20 20:15
 */
@Getter
@Setter
@TableName("t_floor")
public class TFloor extends BaseEntity {

    private static final long serialVersionUID = 1L;

    /**
     * 楼层名称
     */
    private String floorName;
    /**
     * 楼层编号数
     */
    private Integer floorNo;
    /**
     * 所属楼栋ID
     */
    private Long buildingId;
    /**
     * 所属楼栋名称
     */
    private String buildingName;
    /**
     * 设备数量
     */
    private Integer deviceNumber;
    /**
     * 楼层平面图纸（PDF DWG CAD 5MB以内）
     */
    private String floorDrawing;
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
