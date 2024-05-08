require "test_helper"

class CurriculumsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @curriculum = curriculums(:one)
  end

  test "should get index" do
    get curriculums_url
    assert_response :success
  end

  test "should get new" do
    get new_curriculum_url
    assert_response :success
  end

  test "should create curriculum" do
    assert_difference("Curriculum.count") do
      post curriculums_url, params: { curriculum: { data: @curriculum.data, name: @curriculum.name, user_id: @curriculum.user_id } }
    end

    assert_redirected_to curriculum_url(Curriculum.last)
  end

  test "should show curriculum" do
    get curriculum_url(@curriculum)
    assert_response :success
  end

  test "should get edit" do
    get edit_curriculum_url(@curriculum)
    assert_response :success
  end

  test "should update curriculum" do
    patch curriculum_url(@curriculum), params: { curriculum: { data: @curriculum.data, name: @curriculum.name, user_id: @curriculum.user_id } }
    assert_redirected_to curriculum_url(@curriculum)
  end

  test "should destroy curriculum" do
    assert_difference("Curriculum.count", -1) do
      delete curriculum_url(@curriculum)
    end

    assert_redirected_to curriculums_url
  end
end
