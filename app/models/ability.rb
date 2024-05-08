# frozen_string_literal: true

class Ability
  include CanCan::Ability

  def initialize(user)
    can :read, :dashboard # grant access to the dashboard
    if user
      can :access, :rails_admin # grant access to rails_admin
      can :manage, Curriculum, user_id: user.id
    else
    end
  end
end
