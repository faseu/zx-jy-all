package com.youlai.boot.system.service.impl;

import cn.hutool.core.collection.CollectionUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.youlai.boot.security.util.SecurityUtils;
import com.youlai.boot.system.enums.DictCodeEnum;
import com.youlai.boot.system.model.dto.AlarmExportDTO;
import com.youlai.boot.system.model.dto.UserExportDTO;
import com.youlai.boot.system.model.entity.DictItem;
import com.youlai.boot.system.model.query.UserPageQuery;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.youlai.boot.system.mapper.TAlarmMapper;
import com.youlai.boot.system.service.TAlarmService;
import com.youlai.boot.system.model.entity.TAlarm;
import com.youlai.boot.system.model.form.TAlarmForm;
import com.youlai.boot.system.model.query.TAlarmQuery;
import com.youlai.boot.system.model.vo.TAlarmVO;
import com.youlai.boot.system.converter.TAlarmConverter;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import cn.hutool.core.lang.Assert;
import cn.hutool.core.util.StrUtil;

/**
 * 告警服务实现类
 *
 * @author youlaitech
 * @since 2026-01-20 20:18
 */
@Service
@RequiredArgsConstructor
public class TAlarmServiceImpl extends ServiceImpl<TAlarmMapper, TAlarm> implements TAlarmService {

    private final TAlarmConverter tAlarmConverter;

    /**
    * 获取告警分页列表
    *
    * @param queryParams 查询参数
    * @return {@link IPage<TAlarmVO>} 告警分页列表
    */
    @Override
    public IPage<TAlarmVO> getTAlarmPage(TAlarmQuery queryParams) {
        Page<TAlarmVO> pageVO = this.baseMapper.getTAlarmPage(
                new Page<>(queryParams.getPageNum(), queryParams.getPageSize()),
                queryParams
        );
        return pageVO;
    }
    
    /**
     * 获取告警表单数据
     *
     * @param id 告警ID
     * @return 告警表单数据
     */
    @Override
    public TAlarmForm getTAlarmFormData(Long id) {
        TAlarm entity = this.getById(id);
        return tAlarmConverter.toForm(entity);
    }
    
    /**
     * 新增告警
     *
     * @param formData 告警表单对象
     * @return 是否新增成功
     */
    @Override
    public boolean saveTAlarm(TAlarmForm formData) {
        TAlarm entity = tAlarmConverter.toEntity(formData);
        return this.save(entity);
    }
    
    /**
     * 更新告警
     *
     * @param id   告警ID
     * @param formData 告警表单对象
     * @return 是否修改成功
     */
    @Override
    public boolean updateTAlarm(Long id,TAlarmForm formData) {
        TAlarm entity = tAlarmConverter.toEntity(formData);
        return this.updateById(entity);
    }
    
    /**
     * 删除告警
     *
     * @param ids 告警ID，多个以英文逗号(,)分割
     * @return 是否删除成功
     */
    @Override
    public boolean deleteTAlarms(String ids) {
        Assert.isTrue(StrUtil.isNotBlank(ids), "删除的告警数据为空");
        // 逻辑删除
        List<Long> idList = Arrays.stream(ids.split(","))
                .map(Long::parseLong)
                .toList();
        return this.removeByIds(idList);
    }

    /**
     * 获取导出告警列表
     *
     * @param queryParams 查询参数
     * @return {@link List< AlarmExportDTO >} 导出告警列表
     */
    @Override
    public List<AlarmExportDTO> listExportAlarms(TAlarmQuery queryParams) {
        List<AlarmExportDTO> exportAlarms = this.baseMapper.listExportAlarms(queryParams);
        return exportAlarms;
    }
}
