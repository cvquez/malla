class CreateCurriculums < ActiveRecord::Migration[7.0]
  def change
    create_table :curriculums do |t|
      t.string :name
      t.json :data
      t.references :user, null: false, foreign_key: true

      t.timestamps
    end
  end
end
