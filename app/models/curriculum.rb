class Curriculum < ApplicationRecord
  scope :by_user, lambda { |user|
    where(:user_id => user.id)
  }
  belongs_to :user
  validates :name, :data, :user_id, presence: true

  def data_default
    {
      "class": "go.GraphLinksModel",
      "nodeDataArray": [
      { key: "semestre1", text: "1", isGroup: true },
      { key: "semestre2", text: "2", isGroup: true },
      { key: "semestre3", text: "3", isGroup: true },
      { key: "semestre4", text: "4", isGroup: true },
      { key: "semestre5", text: "5", isGroup: true },
      { key: "semestre6", text: "6", isGroup: true },
      { key: "semestre7", text: "7", isGroup: true },
      { key: "semestre8", text: "8", isGroup: true },
      { key: "semestre9", text: "9", isGroup: true },
      { key: "semestre10", text: "10", isGroup: true }
    ]
    }
  end
end
