package com.youlai.boot.system.model.query;

import com.youlai.boot.common.base.BasePageQuery;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Schema(description = "操作日志分页查询对象")
@Getter
@Setter
public class OperLogPageQuery extends BasePageQuery {

    @Schema(description = "关键字")
    private String keywords;

    @Schema(description = "操作时间范围")
    private List<String> createTime;

    @Schema(description = "省份ID")
    private Long provinceId;

    @Schema(description = "监狱级别")
    private Integer prisonLevel;
}
