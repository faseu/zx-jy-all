package com.youlai.boot.system.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.youlai.boot.system.mapper.DeptMapper;
import com.youlai.boot.system.model.dto.CurrentUserDTO;
import com.youlai.boot.system.model.entity.Dept;
import com.youlai.boot.system.model.vo.ProvinceDetailVO;
import com.youlai.boot.system.model.vo.ProvinceVO;
import com.youlai.boot.system.model.vo.TPrisonDetailVO;
import com.youlai.boot.system.service.ProvinceService;
import com.youlai.boot.system.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 部门 业务实现类
 *
 * @author Ray
 * @since 2021/08/22
 */
@Service
@RequiredArgsConstructor
public class ProvinceServiceImpl extends ServiceImpl<DeptMapper, Dept> implements ProvinceService {

    private final UserService userService;

    @Override
    public List<ProvinceVO> getProvinceList() {
        CurrentUserDTO currentUserInfo = userService.getCurrentUserInfo();
        Set<Long> ids = this.baseMapper.getDeptIdsByUserId(currentUserInfo.getUserId());
        if (currentUserInfo.getRoleIds() != null && currentUserInfo.getRoleIds().contains(1L) && (ids == null || ids.isEmpty())) {
            ids = this.list(new LambdaQueryWrapper<Dept>()
                            .select(Dept::getId)
                            .eq(Dept::getParentId, 1L)
                            .eq(Dept::getIsDeleted, 0))
                    .stream()
                    .map(Dept::getId)
                    .collect(Collectors.toSet());
        }
        return this.baseMapper.getProvinceList(ids);
    }

    @Override
    public ProvinceDetailVO getProvinceInfo(Long provinceId) {
        return this.baseMapper.getProvinceInfo(provinceId);
    }

    @Override
    public List<TPrisonDetailVO> getPrisonList(Long provinceId) {
        return this.baseMapper.getPrisonList(provinceId);
    }
}
