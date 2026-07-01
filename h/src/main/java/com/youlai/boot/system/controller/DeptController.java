package com.youlai.boot.system.controller;

import com.youlai.boot.common.enums.LogModuleEnum;
import com.youlai.boot.common.annotation.RepeatSubmit;
import com.youlai.boot.common.model.Option;
import com.youlai.boot.core.web.Result;
import com.youlai.boot.system.model.form.DeptForm;
import com.youlai.boot.system.model.query.DeptQuery;
import com.youlai.boot.system.model.vo.DeptVO;
import com.youlai.boot.common.annotation.Log;
import com.youlai.boot.system.service.DeptService;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

/**
 * 组织控制器
 *
 * @author Ray.Hao
 * @since 2020/11/6
 */
@Tag(name = "05.组织接口")
@RestController
@RequestMapping("/api/v1/dept")
@RequiredArgsConstructor
public class DeptController {

    private final DeptService deptService;

    @Operation(summary = "组织列表")
    @GetMapping
    @Log( value = "组织列表",module = LogModuleEnum.DEPT)
    public Result<List<DeptVO>> getDeptList(
             DeptQuery queryParams
    ) {
        List<DeptVO> list = deptService.getDeptList(queryParams);
        return Result.success(list);
    }

    @Operation(summary = "组织下拉列表")
    @GetMapping("/options")
    public Result<List<Option<Long>>> getDeptOptions() {
        List<Option<Long>> list = deptService.listDeptOptions();
        return Result.success(list);
    }

    @Operation(summary = "新增组织")
    @PostMapping
    @PreAuthorize("@ss.hasPerm('sys:dept:add')")
    @RepeatSubmit
    public Result<?> saveDept(
            @Valid @RequestBody DeptForm formData
    ) {
        Long id = deptService.saveDept(formData);
        return Result.success(id);
    }

    @Operation(summary = "获取组织表单数据")
    @GetMapping("/{deptId}/form")
    public Result<DeptForm> getDeptForm(
            @Parameter(description ="组织ID") @PathVariable Long deptId
    ) {
        DeptForm deptForm = deptService.getDeptForm(deptId);
        return Result.success(deptForm);
    }

    @Operation(summary = "修改组织")
    @PutMapping(value = "/{deptId}")
    @PreAuthorize("@ss.hasPerm('sys:dept:edit')")
    public Result<?> updateDept(
            @PathVariable Long deptId,
            @Valid @RequestBody DeptForm formData
    ) {
        deptId = deptService.updateDept(deptId, formData);
        return Result.success(deptId);
    }

    @Operation(summary = "删除组织")
    @DeleteMapping("/{ids}")
    @PreAuthorize("@ss.hasPerm('sys:dept:delete')")
    public Result<?> deleteDepartments(
            @Parameter(description ="组织ID，多个以英文逗号(,)分割") @PathVariable("ids") String ids
    ) {
        boolean result = deptService.deleteByIds(ids);
        return Result.judge(result);
    }

}
