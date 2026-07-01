package com.youlai.boot.system.model.query;

import com.youlai.boot.common.base.BasePageQuery;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 告警分页查询对象
 *
 * @author youlaitech
 * @since 2026-01-20 20:18
 */

@Data
@EqualsAndHashCode(callSuper = false)
@Schema(description ="告警查询对象")
public class TAlarmQuery extends BasePageQuery {

    @Schema(description = "所属省份id")
    private Long provinceId;

    @Schema(description = "所属监狱id")
    private Long prisonId;

    @Schema(description = "所属楼栋id")
    private Long buildingId;

    @Schema(description = "所属楼层id")
    private Long floorId;

    @Schema(description = "搜索时间开始：2025-10-10 01:01:01")
    private String startDate;

    @Schema(description = "搜索时间结束：2025-12-10 01:01:01")
    private String endDate;

    @Schema(description = "设备名称")
    private String deviceName;

    @Schema(description = "告警类型Bit0:低温告警Bit1:过温告警Bit2:过压告警Bit3:欠压告警Bit4:过流告警Bit5:欠流告警")
    private String type;

    @Schema(description = "处理状态（0：未处理，1：已处理）")
    private Integer processingStatus;

    @Schema(description = "是否屏蔽（0：否，1：是）")
    private Integer blocked;
}
