package com.youlai.boot.system.service.impl;

import com.alibaba.fastjson.JSON;
import com.youlai.boot.system.model.vo.TBuildingDetailVO;
import com.youlai.boot.system.model.vo.TPrisonInfoVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.youlai.boot.system.mapper.TPrisonMapper;
import com.youlai.boot.system.service.TPrisonService;
import com.youlai.boot.system.model.entity.TPrison;
import com.youlai.boot.system.model.form.TPrisonForm;
import com.youlai.boot.system.model.query.TPrisonQuery;
import com.youlai.boot.system.model.vo.TPrisonVO;
import com.youlai.boot.system.converter.TPrisonConverter;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

import cn.hutool.core.lang.Assert;
import cn.hutool.core.util.StrUtil;

/**
 * 监狱服务实现类
 *
 * @author youlaitech
 * @since 2026-01-20 20:12
 */
@Service
@RequiredArgsConstructor
public class TPrisonServiceImpl extends ServiceImpl<TPrisonMapper, TPrison> implements TPrisonService {

    private final TPrisonConverter tPrisonConverter;

    /**
    * 获取监狱分页列表
    *
    * @param queryParams 查询参数
    * @return {@link IPage<TPrisonVO>} 监狱分页列表
    */
    @Override
    public IPage<TPrisonVO> getTPrisonPage(TPrisonQuery queryParams) {
        Page<TPrisonVO> pageVO = this.baseMapper.getTPrisonPage(
                new Page<>(queryParams.getPageNum(), queryParams.getPageSize()),
                queryParams
        );
        return pageVO;
    }
    
    /**
     * 获取监狱表单数据
     *
     * @param id 监狱ID
     * @return 监狱表单数据
     */
    @Override
    public TPrisonForm getTPrisonFormData(Long id) {
        TPrison entity = this.getById(id);
        return tPrisonConverter.toForm(entity);
    }
    
    /**
     * 新增监狱
     *
     * @param formData 监狱表单对象
     * @return 是否新增成功
     */
    @Override
    public boolean saveTPrison(TPrisonForm formData) {
        formData.setAuthUsers(normalizeAuthUsers(formData.getAuthUsers()));
        TPrison entity = tPrisonConverter.toEntity(formData);
        return this.save(entity);
    }
    
    /**
     * 更新监狱
     *
     * @param id   监狱ID
     * @param formData 监狱表单对象
     * @return 是否修改成功
     */
    @Override
    public boolean updateTPrison(Long id,TPrisonForm formData) {
        formData.setId(id);
        formData.setAuthUsers(normalizeAuthUsers(formData.getAuthUsers()));
        TPrison entity = tPrisonConverter.toEntity(formData);
        return this.updateById(entity);
    }
    
    /**
     * 删除监狱
     *
     * @param ids 监狱ID，多个以英文逗号(,)分割
     * @return 是否删除成功
     */
    @Override
    public boolean deleteTPrisons(String ids) {
        Assert.isTrue(StrUtil.isNotBlank(ids), "删除的监狱数据为空");
        // 逻辑删除
        List<Long> idList = Arrays.stream(ids.split(","))
                .map(Long::parseLong)
                .toList();
        return this.removeByIds(idList);
    }

    @Override
    public TPrisonInfoVO getTPrisonInfo(Long prisonId) {
        return this.baseMapper.getTPrisonInfo(prisonId);
    }

    @Override
    public List<TBuildingDetailVO> getBuildingList(Long prisonId) {
        return this.baseMapper.getBuildingList(prisonId);
    }

    private String normalizeAuthUsers(String authUsers) {
        if (StrUtil.isBlank(authUsers)) {
            return "[]";
        }

        String trimmed = authUsers.trim();
        try {
            Object parsed = JSON.parse(trimmed);
            return JSON.toJSONString(parsed);
        } catch (Exception ignored) {
            List<String> users = Arrays.stream(trimmed.split(","))
                    .map(String::trim)
                    .filter(StrUtil::isNotBlank)
                    .collect(Collectors.toList());
            return JSON.toJSONString(users);
        }
    }

}
