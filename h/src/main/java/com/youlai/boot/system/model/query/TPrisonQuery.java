package com.youlai.boot.system.model.query;

import com.youlai.boot.common.base.BasePageQuery;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 监狱分页查询对象
 *
 * @author youlaitech
 * @since 2026-01-20 20:12
 */
@Schema(description ="监狱查询对象")
@Getter
@Setter
public class TPrisonQuery extends BasePageQuery {

}
