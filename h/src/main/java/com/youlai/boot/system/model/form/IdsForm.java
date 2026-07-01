package com.youlai.boot.system.model.form;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.io.Serial;
import java.io.Serializable;
import java.util.List;

/**
 * 设备表单对象
 *
 * @author youlaitech
 * @since 2026-01-20 20:17
 */
@Getter
@Setter
@Schema(description = "设备id表单对象")
public class IdsForm implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Schema(description = "监狱Id")
    private Long prisonId;
    @Schema(description = "楼Id")
    private Long buildingId;
    @Schema(description = "楼层Id")
    private Long floorId;

    @Schema(description = "设备ids")
    private List<Long> ids;
}
