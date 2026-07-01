package com.youlai.boot.system.model.entity;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;
import com.baomidou.mybatisplus.annotation.TableName;
import com.youlai.boot.common.base.BaseEntity;

/**
 * 楼栋实体对象
 *
 * @author youlaitech
 * @since 2026-01-20 20:15
 */
@Getter
@Setter
@TableName("t_building")
public class TBuilding extends BaseEntity {

    private static final long serialVersionUID = 1L;

    /**
     * 楼名称
     */
    private String name;
    /**
     * 楼层数
     */
    private Integer floorNum;
    /**
     * 所属监狱ID
     */
    private Long prisonId;
    /**
     * 所属监狱名称
     */
    private String prisonName;
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

    private Integer groundFloorNum;

    private Integer undergroundFloorNum;
}
