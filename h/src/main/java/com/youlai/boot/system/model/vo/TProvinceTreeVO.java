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
@Schema( description = "省-监狱树视图对象")
public class TProvinceTreeVO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Schema(description = "省id")
    private Long provinceId;
    @Schema(description = "省级名称")
    private String provinceName;
    @Schema(description = "省级下的监狱列表")
    private List<TPrisonTreeVO> prisonList;

}
