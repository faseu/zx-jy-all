package com.youlai.boot.system.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.youlai.boot.security.token.TokenManager;
import com.youlai.boot.system.mapper.UserRoleMapper;
import com.youlai.boot.system.model.entity.UserRole;
import com.youlai.boot.system.service.UserRoleService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserRoleServiceImpl extends ServiceImpl<UserRoleMapper, UserRole> implements UserRoleService {

  private final TokenManager tokenManager;

  @Override
  @Transactional(rollbackFor = Exception.class)
  public void saveUserRole(Long userId, Long roleId) {
    if (userId == null || roleId == null) {
      return;
    }

    List<UserRole> currentRoles = this.list(new LambdaQueryWrapper<UserRole>()
      .eq(UserRole::getUserId, userId));

    if (currentRoles.size() == 1 && roleId.equals(currentRoles.get(0).getRoleId())) {
      return;
    }

    this.remove(new LambdaQueryWrapper<UserRole>()
      .eq(UserRole::getUserId, userId));

    this.save(new UserRole(userId, roleId));
    tokenManager.invalidateUserSessions(userId);
  }

  @Override
  public boolean hasAssignedUsers(Long roleId) {
    int count = this.baseMapper.countUsersForRole(roleId);
    return count > 0;
  }
}
