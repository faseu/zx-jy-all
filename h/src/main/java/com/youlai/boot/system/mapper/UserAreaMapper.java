package com.youlai.boot.system.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.youlai.boot.system.model.entity.UserArea;
import org.apache.ibatis.annotations.Mapper;

/**
 * 用户角色访问层
 *
 * @author haoxr
 * @since 2022/1/15
 */
@Mapper
public interface UserAreaMapper extends BaseMapper<UserArea> {

}
