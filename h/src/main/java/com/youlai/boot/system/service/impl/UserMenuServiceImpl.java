package com.youlai.boot.system.service.impl;

import cn.hutool.core.collection.CollectionUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.youlai.boot.security.token.TokenManager;
import com.youlai.boot.system.mapper.UserAreaMapper;
import com.youlai.boot.system.mapper.UserMenuMapper;
import com.youlai.boot.system.model.entity.UserArea;
import com.youlai.boot.system.model.entity.UserMenu;
import com.youlai.boot.system.service.UserAreaService;
import com.youlai.boot.system.service.UserMenuService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserMenuServiceImpl extends ServiceImpl<UserMenuMapper, UserMenu> implements UserMenuService {


  private final TokenManager tokenManager;

  /**
   * 保存用户角色
   *
   * @param userId 用户ID
   * @param menuIds 选择的区域ID集合
   * @return
   */
  @Override
  public void saveUserMenus(Long userId, List<Long> menuIds) {
    if (userId == null || CollectionUtil.isEmpty(menuIds)) {
      return ;
    }

    // 获取现有角色
    List<Long> userRoleIds = this.list(new LambdaQueryWrapper<UserMenu>()
        .select(UserMenu::getMenuId)
        .eq(UserMenu::getUserId, userId))
      .parallelStream()
      .map(UserMenu::getMenuId)
      .toList();

    // 使用Set提升对比效率
    Set<Long> oldRoles = new HashSet<>(userRoleIds);
    Set<Long> newRoles = new HashSet<>(menuIds);

    // 计算变更集
    Set<Long> addedRoles = new HashSet<>(newRoles);
    addedRoles.removeAll(oldRoles);

    Set<Long> removedRoles = new HashSet<>(oldRoles);
    removedRoles.removeAll(newRoles);

    boolean rolesChanged = !addedRoles.isEmpty() || !removedRoles.isEmpty();

    // 批量保存新增区域
    if (!addedRoles.isEmpty()) {
      this.saveBatch(addedRoles.stream()
        .map(areaId -> new UserMenu(userId, areaId))
        .collect(Collectors.toList()));
    }

    // 删除废弃区域
    if (!removedRoles.isEmpty()) {
      this.remove(new LambdaQueryWrapper<UserMenu>()
        .eq(UserMenu::getUserId, userId)
        .in(UserMenu::getMenuId, removedRoles));
    }

    // 当权限变更时清除被修改用户的登录态
    if (rolesChanged) {
      tokenManager.invalidateUserSessions(userId);
    }
  }


}
