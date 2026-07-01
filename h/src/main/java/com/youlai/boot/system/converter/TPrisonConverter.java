package com.youlai.boot.system.converter;

import org.mapstruct.Mapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.youlai.boot.system.model.entity.TPrison;
import com.youlai.boot.system.model.form.TPrisonForm;

/**
 * 监狱对象转换器
 *
 * @author youlaitech
 * @since 2026-01-20 20:12
 */
@Mapper(componentModel = "spring")
public interface TPrisonConverter{

    TPrisonForm toForm(TPrison entity);

    TPrison toEntity(TPrisonForm formData);
}