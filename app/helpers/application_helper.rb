module ApplicationHelper

  def map_icons(name)
    {
      google_oauth2: 'google',
    }.fetch(name, name.to_s)
  end

  def custom_icon(name, type = :bootstrap, options = {})
    name = map_icons(name) if name.is_a?(Symbol)
    options[:class] = "#{options[:class]} bi bi-#{name.strip}".strip if type == :bootstrap
    content_tag(:i, nil, options)
  end
end
