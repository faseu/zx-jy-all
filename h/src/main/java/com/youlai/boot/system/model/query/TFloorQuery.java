package com.youlai.boot.system.model.query;

import com.youlai.boot.common.base.BasePageQuery;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 楼层分页查询对象
 *
 * @author youlaitech
 * @since 2026-01-20 20:15
 */
@Schema(description ="楼层查询对象")
@Getter
@Setter
public class TFloorQuery extends BasePageQuery {

    @Schema(description = "所属楼栋ID")
    private Long buildingId;

}
