package com.youlai.boot.system.model.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 监狱视图对象
 *
 * @author youlaitech
 * @since 2026-01-20 20:12
 */
@Getter
@Setter
@Schema( description = "监狱视图对象")
public class TPrisonDetailVO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Schema(description = "主键")
    private Long id;
    @Schema(description = "监狱名称")
    private String name;
    @Schema(description = "楼数")
    private Integer buildingNum;
    @Schema(description = "设备数")
    private Integer totalDevices;
    @Schema(description = "监狱等级（1-宽管监狱 2-普管监狱 3-严管监狱)")
    private Integer level;
}
