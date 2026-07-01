package com.youlai.boot.system.model.vo;

import com.youlai.boot.system.model.entity.TDevice;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

import java.io.Serial;
import java.io.Serializable;
import java.util.List;

/**
 * 设备视图对象
 *
 * @author youlaitech
 * @since 2026-01-20 20:17
 */
@Getter
@Setter
@Schema( description = "楼层树视图对象")
public class TFloorTreeVO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Schema(description = "楼层ID")
    private Long floorId;
    @Schema(description = "楼层名称")
    private String floorName;
    @Schema(description = "楼层的设备")
    private List<TDevice> deviceList;

}
