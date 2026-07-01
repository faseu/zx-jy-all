package com.youlai.boot.system.mapper;

import com.baomidou.mybatisplus.core.conditions.Wrapper;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.toolkit.Constants;
import com.youlai.boot.common.annotation.DataPermission;
import com.youlai.boot.system.model.entity.Dept;
import com.youlai.boot.system.model.vo.ProvinceDetailVO;
import com.youlai.boot.system.model.vo.ProvinceVO;
import com.youlai.boot.system.model.vo.TPrisonDetailVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Set;


@Mapper
public interface DeptMapper extends BaseMapper<Dept> {

    @DataPermission(deptIdColumnName = "id")
    @Override
    List<Dept> selectList(@Param(Constants.WRAPPER) Wrapper<Dept> queryWrapper);

    Set<Long> getDeptIdsByUserId(Long userId);

    List<ProvinceVO> getProvinceList(Set<Long> ids);

    ProvinceDetailVO getProvinceInfo(Long provinceId);

    List<TPrisonDetailVO> getPrisonList(Long provinceId);
}
