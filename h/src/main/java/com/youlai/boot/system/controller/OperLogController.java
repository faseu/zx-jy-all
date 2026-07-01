package com.youlai.boot.system.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.youlai.boot.core.web.PageResult;
import com.youlai.boot.core.web.Result;
import com.youlai.boot.system.model.query.LogPageQuery;
import com.youlai.boot.system.model.query.OperLogPageQuery;
import com.youlai.boot.system.model.form.ClientOperLogForm;
import com.youlai.boot.system.model.vo.LogPageVO;
import com.youlai.boot.system.model.vo.OperLogPageVO;
import com.youlai.boot.system.model.vo.VisitStatsVO;
import com.youlai.boot.system.model.vo.VisitTrendVO;
import com.youlai.boot.system.service.LogService;
import com.youlai.boot.system.service.TOperLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

/**
 * 日志控制层
 *
 * @author Ray.Hao
 * @since 2.10.0
 */
@Tag(name = "19.操作日志接口")
@RestController
@RequestMapping("/api/v1/operlogs")
@RequiredArgsConstructor
public class OperLogController {

    private final TOperLogService tOperLogService;

    @Operation(summary = "日志分页列表")
    @GetMapping("/page")
    public PageResult<OperLogPageVO> getOperLogPage(
             OperLogPageQuery queryParams
    ) {
        Page<OperLogPageVO> result = tOperLogService.getLogPage(queryParams);
        return PageResult.success(result);
    }

    @Operation(summary = "客户端操作日志上报")
    @PostMapping("/client")
    public Result<Void> saveClientOperLog(@RequestBody @Valid ClientOperLogForm formData) {
        return Result.judge(tOperLogService.saveClientLog(formData));
    }

}
