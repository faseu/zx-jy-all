package com.youlai.boot.system.model.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 设备视图对象
 *
 * @author youlaitech
 * @since 2026-01-20 20:17
 */
@Getter
@Setter
@Schema( description = "监狱树视图对象")
public class TPrisonTreeVO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Schema(description = "监狱ID")
    private Long prisonId;
    @Schema(description = "监狱名称")
    private String prisonName;
    @Schema(description = "监狱等级（1-宽管监狱 2-普管监狱 3-严管监狱)")
    private Integer level;
    @Schema(description = "监狱下的楼栋")
    private List<TBuildingTreeVO> buildingList;

}
