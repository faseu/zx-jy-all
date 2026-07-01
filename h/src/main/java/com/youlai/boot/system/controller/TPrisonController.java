package com.youlai.boot.system.controller;

import com.youlai.boot.common.annotation.OperLog;
import com.youlai.boot.system.model.vo.TBuildingDetailVO;
import com.youlai.boot.system.model.vo.TPrisonDetailVO;
import com.youlai.boot.system.model.vo.TPrisonInfoVO;
import com.youlai.boot.system.service.TPrisonService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.youlai.boot.system.model.form.TPrisonForm;
import com.youlai.boot.system.model.query.TPrisonQuery;
import com.youlai.boot.system.model.vo.TPrisonVO;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.youlai.boot.core.web.PageResult;
import com.youlai.boot.core.web.Result;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;

/**
 * 监狱前端控制层
 *
 * @author youlaitech
 * @since 2026-01-20 20:12
 */
@Tag(name = "13.监狱接口")
@RestController
@RequestMapping("/api/v1/prison")
@RequiredArgsConstructor
public class TPrisonController  {

    private final TPrisonService tPrisonService;

    @Operation(summary = "监狱详情统计")
    @GetMapping("/info/{id}")
//    @PreAuthorize("@ss.hasPerm('system:prison:query')")
    public Result<TPrisonInfoVO> getTPrisonInfo(
            @Parameter(description = "监狱ID") @PathVariable Long id
    ) {
        TPrisonInfoVO info = tPrisonService.getTPrisonInfo(id);
        return Result.success(info);
    }

    @Operation(summary = "监狱详情楼列表")
    @GetMapping("/buidings/{id}")
    public Result<List<TBuildingDetailVO>> getBuildingList(
            @Parameter(description ="监狱ID") @PathVariable Long id
    ) {
        List<TBuildingDetailVO> info = tPrisonService.getBuildingList(id);
        return Result.success(info);
    }

    @Operation(summary = "监狱分页列表")
    @GetMapping("/page")
//    @PreAuthorize("@ss.hasPerm('system:prison:query')")
    public PageResult<TPrisonVO> getTPrisonPage(TPrisonQuery queryParams ) {
        IPage<TPrisonVO> result = tPrisonService.getTPrisonPage(queryParams);
        return PageResult.success(result);
    }

    @Operation(summary = "新增监狱")
    @PostMapping
    @OperLog(value = "新增监狱")
//    @PreAuthorize("@ss.hasPerm('system:prison:add')")
    public Result<Void> saveTPrison(@RequestBody @Valid TPrisonForm formData ) {
        boolean result = tPrisonService.saveTPrison(formData);
        return Result.judge(result);
    }

    @Operation(summary = "获取监狱表单数据")
    @GetMapping("/{id}/form")
//    @PreAuthorize("@ss.hasPerm('system:prison:edit')")
    public Result<TPrisonForm> getTPrisonForm(
        @Parameter(description = "监狱ID") @PathVariable Long id
    ) {
        TPrisonForm formData = tPrisonService.getTPrisonFormData(id);
        return Result.success(formData);
    }

    @Operation(summary = "修改监狱")
    @PutMapping(value = "/{id}")
    @OperLog(value = "修改监狱")
//    @PreAuthorize("@ss.hasPerm('system:prison:edit')")
    public Result<Void> updateTPrison(
            @Parameter(description = "监狱ID") @PathVariable Long id,
            @RequestBody @Validated TPrisonForm formData
    ) {
        boolean result = tPrisonService.updateTPrison(id, formData);
        return Result.judge(result);
    }

    @Operation(summary = "删除监狱")
    @DeleteMapping("/{ids}")
    @OperLog(value = "删除监狱")
//    @PreAuthorize("@ss.hasPerm('system:prison:delete')")
    public Result<Void> deleteTPrisons(
        @Parameter(description = "监狱ID，多个以英文逗号(,)分割") @PathVariable String ids
    ) {
        boolean result = tPrisonService.deleteTPrisons(ids);
        return Result.judge(result);
    }
}
