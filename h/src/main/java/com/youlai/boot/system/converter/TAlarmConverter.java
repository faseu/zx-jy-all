package com.youlai.boot.system.converter;

import org.mapstruct.Mapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.youlai.boot.system.model.entity.TAlarm;
import com.youlai.boot.system.model.form.TAlarmForm;

/**
 * 告警对象转换器
 *
 * @author youlaitech
 * @since 2026-01-20 20:18
 */
@Mapper(componentModel = "spring")
public interface TAlarmConverter{

    TAlarmForm toForm(TAlarm entity);

    TAlarm toEntity(TAlarmForm formData);
}